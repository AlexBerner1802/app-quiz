<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Answer extends Model
{
    protected $table = 'answers';
    protected $primaryKey = 'id_answer';
    public $timestamps = true;

    protected $fillable = ['id_question','is_correct'];
    protected $casts = ['is_correct' => 'boolean'];

    public function question()
    {
        return $this->belongsTo(Question::class, 'id_question', 'id_question');
    }

    // i18n
    public function translations()
    {
        return $this->hasMany(Translation::class, 'answer_id', 'id_answer')
                    ->where('element_type', 'answer');
    }
}
