<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::query()->get(['UUID','username','name','user_role', 'id_owner'])
        );
    }

    public function createUser(Request $request): JsonResponse
    {
        $content = $request->getContent();
        $content = (array) json_decode($content);

        $user = User::where('name', '=', $content['name'])->first();

        if ($user == null) {
            $user = User::create([
                'name' => $content['name'],
                'username' => $content['username'],
                'id_user' => $content['id_user'],
                'is_dark_mode' => $content['theme'] === "dark"
            ]);
            $message = 'user created';
        } else {
            $message = 'user already exists';
        }

        $role = $user->role()->first();


        return response()->json([
            "message" => $message,
            "user" => [
                'name' => $user->name,
                'username' => $user->username,
                'id_user' => $user->id_user,
                'is_dark_mode' => $user->is_dark_mode === 1 ? 'dark' : 'light',
                'role' => $role ? $role->name : null
            ]
        ]);
    }

    public function updateTheme(Request $request): JsonResponse
    {
        $request->validate([
            'id_user' => 'required',
            'is_dark_mode' => 'required|boolean',
        ]);

        $user = User::where('id_azure', $request->id_user)->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->is_dark_mode = $request->is_dark_mode;
        $user->save();

        return response()->json([
            'message' => 'Theme updated',
            'is_dark_mode' => $user->is_dark_mode
        ]);
    }

    public function getTheme(Request $request): JsonResponse
    {
        $user = User::where('id_owner', $request->id_owner)->first();

        if (!$user) {
            return response()->json([
                'theme' => 'light'
            ]);
        }

        return response()->json([
            'theme' => $user->is_dark_mode ? 1 : 0
        ]);
    }
}
