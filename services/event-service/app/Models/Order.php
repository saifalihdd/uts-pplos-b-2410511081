<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_code','user_id','event_id','ticket_category_id',
        'quantity','total_price','status','paid_at',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'quantity'    => 'integer',
        'paid_at'     => 'datetime',
    ];

    public function event()        { return $this->belongsTo(Event::class); }
    public function ticketCategory(){ return $this->belongsTo(TicketCategory::class); }
    public function tickets()      { return $this->hasMany(Ticket::class); }
}