<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\TicketCategory;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $events = [
            ['title' => 'Java Jazz Festival 2026', 'category' => 'musik',      'location' => 'Jakarta Convention Center'],
            ['title' => 'Tech Summit Indonesia',   'category' => 'teknologi',  'location' => 'Bali International Convention Centre'],
            ['title' => 'Marathon Nasional 2026',  'category' => 'olahraga',   'location' => 'Monas, Jakarta Pusat'],
        ];

        foreach ($events as $i => $data) {
            $event = Event::create(array_merge($data, [
                'description'   => 'Deskripsi ' . $data['title'],
                'start_date'    => now()->addDays(30 + $i * 15),
                'end_date'      => now()->addDays(32 + $i * 15),
                'organizer_id'  => 1,
                'status'        => 'published',
                'total_tickets' => 5000,
                'sold_tickets'  => 0,
            ]));

            TicketCategory::insert([
                ['event_id' => $event->id, 'name' => 'Regular', 'price' => 150000, 'quota' => 3000, 'sold' => 0, 'created_at' => now(), 'updated_at' => now()],
                ['event_id' => $event->id, 'name' => 'VIP',     'price' => 500000, 'quota' => 500,  'sold' => 0, 'created_at' => now(), 'updated_at' => now()],
                ['event_id' => $event->id, 'name' => 'VVIP',    'price' => 1500000,'quota' => 100,  'sold' => 0, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        $this->command->info('✓ Seeder: 3 event + kategori tiket dibuat.');
    }
}