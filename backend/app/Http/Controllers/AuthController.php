<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function azureBootstrap(Request $request)
    {
        $data = $request->validate([
            'access_token' => ['required', 'string'],
            'theme' => ['nullable'],
        ]);

        $azureUser = $this->resolveAzureUserFromAccessToken($data['access_token']);

        if (!$azureUser || empty($azureUser['id_azure'])) {
            return response()->json(['message' => 'Invalid Azure token'], 401);
        }

        $isDark = false;
        if (array_key_exists('theme', $data)) {
            $theme = $data['theme'];
            $isDark = ($theme === 'dark' || $theme === 1 || $theme === true || $theme === '1');
        }

        $user = User::where('id_azure', $azureUser['id_azure'])->first();

        if (!$user) {
            $user = User::create([
                'id_azure' => $azureUser['id_azure'],
                'name' => $azureUser['name'] ?? $azureUser['username'] ?? 'Unknown',
                'username' => $azureUser['username'] ?? 'unknown',
                'is_dark_mode' => $isDark,
            ]);
        } else {
            $dirty = false;

            if (!empty($azureUser['name']) && $user->name !== $azureUser['name']) {
                $user->name = $azureUser['name'];
                $dirty = true;
            }

            if (!empty($azureUser['username']) && $user->username !== $azureUser['username']) {
                $user->username = $azureUser['username'];
                $dirty = true;
            }

            if ($dirty) {
                $user->save();
            }
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'ok' => true,
            'user' => $this->formatUser($user),
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'ok' => true,
            'user' => $this->formatUser($request->user()),
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json($this->formatUser($user));
    }

    public function logout(Request $request)
    {
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['ok' => true]);
    }

    private function resolveAzureUserFromAccessToken(string $accessToken): ?array
    {
        $response = Http::withToken($accessToken)
            ->when(app()->environment('local'), fn ($http) => $http->withoutVerifying())
            ->acceptJson()
            ->get('https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName');

        if (!$response->successful()) {
            return null;
        }

        $data = $response->json();

        return [
            'id_azure' => $data['id'] ?? null,
            'name' => $data['displayName'] ?? null,
            'username' => $data['userPrincipalName'] ?? $data['mail'] ?? null,
        ];
    }

    private function formatUser(User $user): array
    {
        return [
            'id_user' => $user->id_user,
            'id_role' => $user->id_role,
            'id_azure' => $user->id_azure,
            'username' => $user->username,
            'name' => $user->name,
            'avatar' => $user->avatar ?? null,
            'theme' => $user->is_dark_mode ? 'dark' : 'light',
        ];
    }
}