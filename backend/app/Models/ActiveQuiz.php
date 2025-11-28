<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActiveQuiz extends Model
{
    use HasFactory;

    protected $table = 'active_quiz';
    protected $primaryKey = 'id_active_quiz';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'id_quiz',
        'lang',
        'is_active',
    ];

    protected $casts = [
            'is_active' => 'boolean',
    ];

    /**
     * Get the quiz associated with this active quiz.
     */
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class, 'id_quiz', 'id_quiz');
    }

    /**
     * Scope to filter only active quizzes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }

    /**
     * Scope to filter by language
     */
    public function scopeOfLanguage($query, $lang)
    {
        return $query->where('lang', $lang);
    }
}
