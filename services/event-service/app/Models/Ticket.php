<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $fillable = [
        'order_id','event_id','ticket_category_id',
        'user_id','qr_code','status','used_at',
    ];

    protected $casts = ['used_at' => 'datetime'];

    public function order()         { return $this->belongsTo(Order::class); }
    public function event()         { return $this->belongsTo(Event::class); }
    public function ticketCategory(){ return $this->belongsTo(TicketCategory::class); }
}