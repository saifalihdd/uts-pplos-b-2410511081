<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EventController;
use App\Http\Controllers\TicketCategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InternalController;

// Public
Route::get('/events',                [EventController::class, 'index']);
Route::get('/events/{id}',           [EventController::class, 'show']);
Route::get('/events/{id}/categories',[TicketCategoryController::class, 'index']);

// Protected
Route::middleware('jwt.verify')->group(function () {
    Route::post('/events',                         [EventController::class, 'store']);
    Route::put('/events/{id}',                     [EventController::class, 'update']);
    Route::patch('/events/{id}',                   [EventController::class, 'update']);
    Route::delete('/events/{id}',                  [EventController::class, 'destroy']);

    Route::post('/events/{id}/categories',         [TicketCategoryController::class, 'store']);
    Route::put('/events/{eventId}/categories/{id}',[TicketCategoryController::class, 'update']);
    Route::delete('/events/{eventId}/categories/{id}',[TicketCategoryController::class, 'destroy']);

    Route::get('/orders',     [OrderController::class, 'index']);
    Route::post('/orders',    [OrderController::class, 'store']);
    Route::get('/orders/{id}',[OrderController::class, 'show']);
    Route::delete('/orders/{id}',[OrderController::class, 'cancel']);
});

// Internal
Route::prefix('internal')->group(function () {
    Route::get('/tickets/{qrCode}',       [InternalController::class, 'getTicketByQr']);
    Route::patch('/tickets/{qrCode}/use', [InternalController::class, 'markTicketUsed']);
});