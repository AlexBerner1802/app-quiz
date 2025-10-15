<?php

namespace App\Http\Controllers;

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
            $newUser = User::create(['name' => $content['name'], 'username' => $content['username'], 'azure_id' => $content['azure_id']]);
            return $newUser;
        }

    }
}