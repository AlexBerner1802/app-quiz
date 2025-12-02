<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_attempt';

    protected $fillable = [
        'id_quiz', 'id_user', 'lang', 'started_at', 'ended_at', 'time_taken', 'score'
    ];

    public function answers(): HasMany
    {
        return $this->hasMany(QuizAttemptAnswer::class, 'id_attempt', 'id_attempt');
    }
}
