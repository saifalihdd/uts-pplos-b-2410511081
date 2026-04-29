<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        $orders = $this->orderService->getUserOrders(
            (int) $request->header('X-User-Id'),
            min((int) $request->get('per_page', 10), 50),
            (int) $request->get('page', 1)
        );

        return response()->json([
            'success' => true,
            'data'    => $orders->items(),
            'meta'    => ['current_page' => $orders->currentPage(), 'per_page' => $orders->perPage(), 'total' => $orders->total(), 'last_page' => $orders->lastPage()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ticket_category_id' => 'required|integer|exists:ticket_categories,id',
            'quantity'           => 'required|integer|min:1|max:10',
        ]);

        if ($validator->fails())
            return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);

        $order = $this->orderService->checkout(
            $validator->validated(),
            (int) $request->header('X-User-Id')
        );

        return response()->json([
            'success' => true,
            'message' => 'Pemesanan berhasil. E-ticket sudah dibuat.',
            'data'    => [
                'order'   => $order,
                'tickets' => $order->tickets->map(fn($t) => ['id' => $t->id, 'qr_code' => $t->qr_code, 'status' => $t->status]),
            ],
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = Order::with(['event','ticketCategory','tickets'])
            ->where('user_id', (int) $request->header('X-User-Id'))
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $order]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = $this->orderService->cancel($id, (int) $request->header('X-User-Id'));
        return response()->json(['success' => true, 'message' => 'Order dibatalkan.', 'data' => $order]);
    }
}