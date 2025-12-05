<?php

use App\Http\Controllers\ModuleController;
use App\Http\Controllers\QuizAttemptController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;


Route::get('/ping', function () {
    return response()->json(['message' => 'API is working!']);
});


// Quizzes
Route::apiResource('quizzes', QuizController::class)->only(['index','show','store','update','destroy']);
Route::get('/quizzes/{id}/editor', [QuizController::class, 'editor']);
Route::post('/quizzes/{quiz}/attempts/start', [QuizAttemptController::class, 'start']);
Route::post('/quizzes/{quiz}/attempts/{attempt}/finish', [QuizAttemptController::class, 'finish']);

// Modules
Route::get('/modules', [ModuleController::class, 'index']);
Route::post('/modules', [ModuleController::class, 'store']);
Route::post('/modules/update', [ModuleController::class, 'update']);

// Tags
Route::get('/tags', [TagController::class, 'index']);
Route::post('/tags/update', [TagController::class, 'update']);

// Users
Route::post('/user', [UserController::class, 'createUser']);
Route::put('/user/theme', [UserController::class, 'updateTheme']);
Route::get('/user/theme', [UserController::class, 'getTheme']);


// Preflight
Route::options('/{any}', function () {
    return response('', 204);
})->where('any', '.*');
