<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $table = 'questions';
    protected $fillable = ['id_type','id_quiz','question_titre','question_description','created_at','updated_at'];
    public $timestamps = true;

    public function quiz()    { return $this->belongsTo(Quiz::class, 'id_quiz'); }
    public function type()    { return $this->belongsTo(TypeQuestion::class, 'id_type'); }
    public function answers() { return $this->hasMany(Answer::class, 'id_question'); }
}

// app/Models/Answer.php
class Answer extends Model
{
    protected $table = 'answers';
    protected $fillable = ['id_question','answer_text','is_correct','created_at','updated_at'];
    public $timestamps = true;

    public function question() { return $this->belongsTo(Question::class, 'id_question'); }
}
