<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttemptAnswer extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_quiz_attempt_answer';

    protected $fillable = [
        'id_attempt', 'id_question', 'answer_ids', 'answer_text',
    ];

    protected $casts = [
        'answer_ids' => 'array',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuizAttempt::class, 'id_attempt');
    }
}
