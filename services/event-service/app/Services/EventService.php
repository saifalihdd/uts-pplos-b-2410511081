<?php

namespace App\Services;

use App\Models\Event;
use Illuminate\Pagination\LengthAwarePaginator;

class EventService
{
    public function getAll(array $filters, int $perPage, int $page): LengthAwarePaginator
    {
        return Event::with('ticketCategories')
            ->filter($filters)
            ->orderBy('start_date', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function findById(int $id): Event
    {
        return Event::with(['ticketCategories'])->findOrFail($id);
    }

    public function create(array $data, int $organizerId): Event
    {
        return Event::create(array_merge($data, [
            'organizer_id' => $organizerId,
            'status'       => 'draft',
            'sold_tickets' => 0,
        ]));
    }

    public function update(int $id, array $data, int $requesterId): Event
    {
        $event = Event::findOrFail($id);

        // 403 — bukan organizer event ini
        if ($event->organizer_id !== $requesterId)
            abort(403, 'Anda tidak berhak mengedit event ini.');

        // 409 — tidak bisa cancel event yang sudah ada tiket terjual
        if (isset($data['status']) && $data['status'] === 'cancelled' && $event->sold_tickets > 0)
            abort(409, 'Event tidak bisa dibatalkan karena sudah ada tiket terjual.');

        $event->update($data);
        return $event->fresh(['ticketCategories']);
    }

    public function delete(int $id, int $requesterId): void
    {
        $event = Event::findOrFail($id);

        // 403
        if ($event->organizer_id !== $requesterId)
            abort(403, 'Anda tidak berhak menghapus event ini.');

        // 409
        if ($event->sold_tickets > 0)
            abort(409, 'Event tidak bisa dihapus karena sudah ada tiket terjual.');

        $event->delete();
    }
}