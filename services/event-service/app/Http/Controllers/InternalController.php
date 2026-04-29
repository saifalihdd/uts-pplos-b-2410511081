<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternalController extends Controller
{
    private function checkInternalKey(Request $request): bool
    {
        return $request->header('X-Internal-Key') === env('INTERNAL_SERVICE_KEY');
    }

    public function getTicketByQr(Request $request, string $qrCode): JsonResponse
    {
        if (!$this->checkInternalKey($request))
            return response()->json(['message' => 'Unauthorized'], 401);

        $ticket = Ticket::with(['event','ticketCategory','order'])
            ->where('qr_code', $qrCode)->first();

        if (!$ticket)
            return response()->json(['success' => false, 'message' => 'Tiket tidak ditemukan.'], 404);

        return response()->json(['success' => true, 'data' => $ticket]);
    }

    public function markTicketUsed(Request $request, string $qrCode): JsonResponse
    {
        if (!$this->checkInternalKey($request))
            return response()->json(['message' => 'Unauthorized'], 401);

        $ticket = Ticket::where('qr_code', $qrCode)->first();

        if (!$ticket)
            return response()->json(['success' => false, 'message' => 'Tiket tidak ditemukan.'], 404);

        if ($ticket->status === 'used')
            return response()->json(['success' => false, 'message' => 'Tiket sudah digunakan.', 'used_at' => $ticket->used_at], 409);

        if ($ticket->status !== 'active')
            return response()->json(['success' => false, 'message' => 'Tiket tidak aktif. Status: '.$ticket->status], 422);

        $ticket->update(['status' => 'used', 'used_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Tiket valid. Selamat datang!', 'data' => $ticket->fresh()]);
    }
}