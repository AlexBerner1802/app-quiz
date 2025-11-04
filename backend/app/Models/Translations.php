<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Translations extends Model
{
    use HasFactory;

    protected $table = 'translations';
    protected $primaryKey = 'id_translation';
    public $timestamps = true;

    protected $fillable = [
        'lang',
        'element_type',
        'field_name',
        'quiz_id',
        'question_id',
        'answer_id',
        'element_text',
    ];

    /**
     * Relationships
     */

    // If translation is for a quiz
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class, 'quiz_id', 'id_quiz');
    }

    // If translation is for a question
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'question_id', 'id_question');
    }

    // If translation is for an answer
    public function answer(): BelongsTo
    {
        return $this->belongsTo(Answer::class, 'answer_id', 'id_answer');
    }
}
