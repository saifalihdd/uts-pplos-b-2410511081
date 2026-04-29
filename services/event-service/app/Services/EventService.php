<?php

namespace App\Services;

use App\Models\Event;

class EventService
{
    public function getAll(array $filters, int $perPage, int $page)
    {
        return Event::with('ticketCategories')
            ->filter($filters)
            ->orderBy('start_date', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function findById(int $id): Event
    {
        return Event::with('ticketCategories')->findOrFail($id);
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

        if ($event->organizer_id !== $requesterId)
            abort(403, 'Anda tidak berhak mengedit event ini.');

        $event->update($data);
        return $event->fresh();
    }

    public function delete(int $id, int $requesterId): void
    {
        $event = Event::findOrFail($id);

        if ($event->organizer_id !== $requesterId)
            abort(403, 'Anda tidak berhak menghapus event ini.');

        if ($event->sold_tickets > 0)
            abort(409, 'Event tidak bisa dihapus karena sudah ada tiket terjual.');

        $event->delete();
    }
}