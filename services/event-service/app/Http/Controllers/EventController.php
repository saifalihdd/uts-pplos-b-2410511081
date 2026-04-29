<?php

namespace App\Http\Controllers;

use App\Services\EventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    public function __construct(private readonly EventService $eventService) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['category','status','search','date_from','date_to']);
        $perPage = min((int) $request->get('per_page', 10), 100);
        $page    = (int) $request->get('page', 1);

        $events = $this->eventService->getAll($filters, $perPage, $page);

        return response()->json([
            'success' => true,
            'data'    => $events->items(),
            'meta'    => [
                'current_page' => $events->currentPage(),
                'per_page'     => $events->perPage(),
                'total'        => $events->total(),
                'last_page'    => $events->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->eventService->findById($id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
            'location'      => 'required|string|max:500',
            'start_date'    => 'required|date|after:now',
            'end_date'      => 'required|date|after:start_date',
            'category'      => 'required|in:musik,olahraga,teknologi,seni,pendidikan,lainnya',
            'banner_url'    => 'nullable|url',
            'total_tickets' => 'required|integer|min:1',
        ]);

        if ($validator->fails())
            return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);

        $event = $this->eventService->create(
            $validator->validated(),
            (int) $request->header('X-User-Id')
        );

        return response()->json(['success' => true, 'message' => 'Event berhasil dibuat.', 'data' => $event], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'         => 'sometimes|string|max:255',
            'description'   => 'sometimes|string',
            'location'      => 'sometimes|string|max:500',
            'start_date'    => 'sometimes|date',
            'end_date'      => 'sometimes|date|after:start_date',
            'category'      => 'sometimes|in:musik,olahraga,teknologi,seni,pendidikan,lainnya',
            'banner_url'    => 'nullable|url',
            'status'        => 'sometimes|in:draft,published,cancelled',
            'total_tickets' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails())
            return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);

        $event = $this->eventService->update($id, $validator->validated(), (int) $request->header('X-User-Id'));

        return response()->json(['success' => true, 'message' => 'Event diperbarui.', 'data' => $event]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->eventService->delete($id, (int) $request->header('X-User-Id'));

        return response()->json(['success' => true, 'message' => 'Event dihapus.']);
    }
}