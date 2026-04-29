<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EventController;
use App\Http\Controllers\TicketCategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InternalController;

Route::prefix('api/events')->group(function () {
    Route::get('/',    [EventController::class, 'index']);
    Route::get('/{id}',[EventController::class, 'show']);
    Route::get('/{id}/categories', [TicketCategoryController::class, 'index']);
});

Route::prefix('api/events')->middleware('jwt.verify')->group(function () {
    Route::post('/',    [EventController::class, 'store']);
    Route::put('/{id}', [EventController::class, 'update']);
    Route::patch('/{id}',[EventController::class, 'update']);
    Route::delete('/{id}',[EventController::class, 'destroy']);

    Route::post('/{id}/categories',              [TicketCategoryController::class, 'store']);
    Route::put('/{eventId}/categories/{id}',     [TicketCategoryController::class, 'update']);
    Route::delete('/{eventId}/categories/{id}',  [TicketCategoryController::class, 'destroy']);
});

Route::prefix('api/orders')->middleware('jwt.verify')->group(function () {
    Route::get('/',       [OrderController::class, 'index']);
    Route::post('/',      [OrderController::class, 'store']);
    Route::get('/{id}',   [OrderController::class, 'show']);
    Route::delete('/{id}',[OrderController::class, 'cancel']);
});

Route::prefix('internal')->group(function () {
    Route::get('/tickets/{qrCode}',        [InternalController::class, 'getTicketByQr']);
    Route::patch('/tickets/{qrCode}/use',  [InternalController::class, 'markTicketUsed']);
});