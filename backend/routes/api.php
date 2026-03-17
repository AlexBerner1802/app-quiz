<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\QuizAttemptController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizLeaderboardController;

Route::get('/ping', fn () => response()->json(['message' => 'API is working!']));

/**
 * Auth (session cookie)
 */
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/azure/bootstrap', [AuthController::class, 'azureBootstrap']);Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

/**
 * Public reads
 */
Route::get('/quizzes', [QuizController::class, 'index']);
Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);

Route::get('/modules', [ModuleController::class, 'index']);
Route::get('/tags', [TagController::class, 'index']);

Route::get('/leaderboard', [LeaderboardController::class, 'index']);
Route::get('/users/{id_user}/profile', [ProfileController::class, 'show']);
Route::get('/users/{id_user}/quizzes/{id_quiz}/results', [ProfileController::class, 'quizResults']);
Route::get('/quizzes/{id_quiz}/leaderboard', [QuizLeaderboardController::class, 'show']);

/**
 * Authenticated (Apprentice OK)
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/user', [UserController::class, 'createUser']);
    Route::put('/user/theme', [UserController::class, 'updateTheme']);
    Route::get('/user/theme', [UserController::class, 'getTheme']);

    Route::post('/quizzes/{quiz}/attempts/start', [QuizAttemptController::class, 'start']);
    Route::post('/quizzes/{quiz}/attempts/{attempt}/finish', [QuizAttemptController::class, 'finish']);
});

/**
 * Authenticated + Role Trainer/Admin
 */
Route::middleware(['auth:sanctum', 'role:2,3'])->group(function () {
    Route::post('/quizzes', [QuizController::class, 'store']);
    Route::put('/quizzes/{quiz}', [QuizController::class, 'update']);
    Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy']);

    Route::get('/quizzes/{id}/editor', [QuizController::class, 'editor']);

    Route::post('/modules', [ModuleController::class, 'store']);
    Route::post('/modules/update', [ModuleController::class, 'update']);
    Route::post('/tags/update', [TagController::class, 'update']);
});

/**
 * Preflight
 */
Route::options('/{any}', fn () => response('', 204))->where('any', '.*');