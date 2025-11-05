<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Answer extends Model
{
    protected $table = 'answers';
    protected $primaryKey = 'id_answer';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'id_question',
        'is_correct',
    ];

    // Parent question
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'id_question', 'id_question');
    }

    // i18n
    public function translations(): HasMany
    {
        return $this->hasMany(Translation::class, 'answer_id', 'id_answer')
                    ->where('element_type', 'answer');
    }
}
