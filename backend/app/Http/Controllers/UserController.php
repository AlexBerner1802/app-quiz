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
    public function index()
    {
        return response()->json(
            User::query()->get(['UUID','username','name','user_role', 'azure_id'])
        );
    }

    public function createUser(Request $request)
    {
        $content = $request->getContent();
        $content = (array) json_decode($content);

        $user = User::where('name', '=', $content['name'])->first();
        if ($user != null) {
            return 'user already exists';
        } else {
            $newUser = User::create([
                'name' => $content['name'],
                'username' => $content['username'],
                'azure_id' => $content['azure_id'],
                'is_dark_mode' => $content['theme'] === "dark"],
        );
            return $newUser;
        }
    }

    public function updateTheme(Request $request): JsonResponse
    {
        $request->validate([
            'azure_id' => 'required',
            'is_dark_mode' => 'required|boolean',
        ]);

        $user = User::where('azure_id', $request->azure_id)->first();

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

    public function getTheme(Request $request)
    {
        $user = User::where('azure_id', $request->azure_id)->first();

        if (!$user) {
            return response()->json([
                'theme' => 'light'
            ]);
        }

        return response()->json([
            'theme' => $user->is_dark_mode ? 'dark' : 'light'
        ]);
    }
}
