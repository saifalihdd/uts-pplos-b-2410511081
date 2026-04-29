<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketCategory extends Model
{
    protected $fillable = ['event_id','name','description','price','quota','sold'];

    protected $casts = [
        'price' => 'decimal:2',
        'quota' => 'integer',
        'sold'  => 'integer',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function getAvailableAttribute(): int
    {
        return $this->quota - $this->sold;
    }
}