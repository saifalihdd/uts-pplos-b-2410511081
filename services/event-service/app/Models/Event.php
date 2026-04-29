<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title','description','location','start_date','end_date',
        'category','banner_url','organizer_id','status','total_tickets','sold_tickets',
    ];

    protected $casts = [
        'start_date'    => 'datetime',
        'end_date'      => 'datetime',
        'total_tickets' => 'integer',
        'sold_tickets'  => 'integer',
    ];

    public function ticketCategories()
    {
        return $this->hasMany(TicketCategory::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function scopeFilter($query, array $filters)
    {
        if (!empty($filters['category']))
            $query->where('category', $filters['category']);
        if (!empty($filters['status']))
            $query->where('status', $filters['status']);
        if (!empty($filters['search']))
            $query->where('title', 'like', '%'.$filters['search'].'%');
        if (!empty($filters['date_from']))
            $query->whereDate('start_date', '>=', $filters['date_from']);
        if (!empty($filters['date_to']))
            $query->whereDate('start_date', '<=', $filters['date_to']);
    }
}