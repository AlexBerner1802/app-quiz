<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $table = 'questions';
    protected $primaryKey = 'id_question';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'id_quiz',
        'id_type',
        'order',
    ];

    // Parent quiz
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class, 'id_quiz', 'id_quiz');
    }

    public function type()    { return $this->belongsTo(TypeQuestion::class, 'id_type'); }

    // Answers to the question
    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class, 'id_question', 'id_question');
    }

    // Translations
    public function translations(): HasMany
    {
        return $this->hasMany(Translation::class, 'element_id', 'id_question')
                    ->where('element_type', 'question');
    }
}

// app/Models/Answer.php
/*
class Answer extends Model
{
    protected $table = 'answers';
    protected $fillable = ['id_question','answer_text','is_correct','created_at','updated_at'];
    public $timestamps = true;

    public function question() { return $this->belongsTo(Question::class, 'id_question'); }
}
*/