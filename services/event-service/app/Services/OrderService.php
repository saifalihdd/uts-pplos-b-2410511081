<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function checkout(array $data, int $userId): Order
    {
        return DB::transaction(function () use ($data, $userId) {
            $category = TicketCategory::lockForUpdate()->findOrFail($data['ticket_category_id']);

            if (($category->quota - $category->sold) < $data['quantity'])
                abort(409, "Stok tidak cukup. Tersedia: " . ($category->quota - $category->sold));

            $order = Order::create([
                'order_code'         => 'ORD-' . strtoupper(Str::random(10)),
                'user_id'            => $userId,
                'event_id'           => $category->event_id,
                'ticket_category_id' => $category->id,
                'quantity'           => $data['quantity'],
                'total_price'        => $category->price * $data['quantity'],
                'status'             => 'paid',
                'paid_at'            => now(),
            ]);

            for ($i = 0; $i < $data['quantity']; $i++) {
                Ticket::create([
                    'order_id'           => $order->id,
                    'event_id'           => $category->event_id,
                    'ticket_category_id' => $category->id,
                    'user_id'            => $userId,
                    'qr_code'            => 'TKT-' . strtoupper((string) Str::uuid()),
                    'status'             => 'active',
                ]);
            }

            $category->increment('sold', $data['quantity']);
            $category->event->increment('sold_tickets', $data['quantity']);

            return $order->load(['tickets', 'event', 'ticketCategory']);
        });
    }

    public function getUserOrders(int $userId, int $perPage, int $page)
    {
        return Order::with(['event','ticketCategory','tickets'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function cancel(int $orderId, int $userId): Order
    {
        $order = Order::where('user_id', $userId)->findOrFail($orderId);

        if ($order->status !== 'pending')
            abort(409, 'Order yang sudah dibayar tidak bisa dibatalkan.');

        DB::transaction(function () use ($order) {
            $order->tickets()->update(['status' => 'cancelled']);
            $order->update(['status' => 'cancelled']);
            $order->ticketCategory->decrement('sold', $order->quantity);
            $order->event->decrement('sold_tickets', $order->quantity);
        });

        return $order->fresh();
    }
}