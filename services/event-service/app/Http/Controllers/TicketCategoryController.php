<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\TicketCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TicketCategoryController extends Controller
{
    public function index(int $id): JsonResponse
    {
        $event      = Event::findOrFail($id);
        $categories = $event->ticketCategories()
            ->selectRaw('*, (quota - sold) as available')
            ->get();

        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function store(Request $request, int $id): JsonResponse
    {
        Event::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'quota'       => 'required|integer|min:1',
        ]);

        if ($validator->fails())
            return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);

        $category = TicketCategory::create(array_merge(
            $validator->validated(),
            ['event_id' => $id, 'sold' => 0]
        ));

        return response()->json(['success' => true, 'message' => 'Kategori ditambahkan.', 'data' => $category], 201);
    }

    public function update(Request $request, int $eventId, int $id): JsonResponse
    {
        $category = TicketCategory::where('event_id', $eventId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'        => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'price'       => 'sometimes|numeric|min:0',
            'quota'       => 'sometimes|integer|min:'.$category->sold,
        ]);

        if ($validator->fails())
            return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);

        $category->update($validator->validated());

        return response()->json(['success' => true, 'message' => 'Kategori diperbarui.', 'data' => $category->fresh()]);
    }

    public function destroy(int $eventId, int $id): JsonResponse
    {
        $category = TicketCategory::where('event_id', $eventId)->findOrFail($id);

        if ($category->sold > 0)
            return response()->json(['success' => false, 'message' => 'Kategori tidak bisa dihapus, sudah ada tiket terjual.'], 409);

        $category->delete();

        return response()->json(['success' => true, 'message' => 'Kategori dihapus.']);
    }
}