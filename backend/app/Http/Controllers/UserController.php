<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::query()->get([
                'id_user',
                'id_azure',
                'username',
                'name',
                'id_role',
                'avatar',
                'is_dark_mode',
            ])
        );
    }

    public function createUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255'],
            'id_azure' => ['required', 'string', 'max:255'],
            'theme' => ['nullable'],
        ]);

        $isDark = false;
        if (array_key_exists('theme', $data)) {
            $theme = $data['theme'];
            $isDark = ($theme === 'dark' || $theme === 1 || $theme === true || $theme === '1');
        }

        $user = User::where('id_azure', $data['id_azure'])->first();

        if (!$user) {
            $user = User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'id_azure' => $data['id_azure'],
                'is_dark_mode' => $isDark,
            ]);
            $message = 'user created';
        } else {
            $message = 'user already exists';
        }

        $role = method_exists($user, 'role') ? $user->role()->first() : null;

        return response()->json([
            'message' => $message,
            'user' => [
                'id_user' => (int) $user->id_user,
                'id_azure' => $user->id_azure,
                'name' => $user->name,
                'username' => $user->username,
                'theme' => $user->is_dark_mode ? 'dark' : 'light',
                'id_role' => $user->id_role ?? null,
                'role' => $role ? $role->name : null,
                'avatar' => $user->avatar ?? null,
            ],
        ]);
    }

    // Update theme for the currently authenticated user

    public function updateTheme(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'is_dark_mode' => ['required', 'boolean'],
        ]);

        $user->is_dark_mode = (bool) $data['is_dark_mode'];
        $user->save();

        return response()->json([
            'message' => 'Theme updated',
            'theme' => $user->is_dark_mode ? 'dark' : 'light',
        ]);
    }


    // Get theme for the currently authenticated user
     
    public function getTheme(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['theme' => 'light'], 200);
        }

        return response()->json([
            'theme' => $user->is_dark_mode ? 'dark' : 'light',
        ], 200);
    }

    public function byAzure(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'This endpoint is deprecated. Use /api/me instead.',
        ], 410);
    }
}