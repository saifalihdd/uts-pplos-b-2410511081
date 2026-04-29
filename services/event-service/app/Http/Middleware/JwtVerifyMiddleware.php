<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class JwtVerifyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $userId = $request->header('X-User-Id');

        if (!$userId || !is_numeric($userId)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Request harus melalui API Gateway.',
            ], 401);
        }

        return $next($request);
    }
}