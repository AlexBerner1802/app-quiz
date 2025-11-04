<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Translation extends Model
{
    protected $table = 'translations';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'lang',
        'element_type',   // 'quiz' | 'question' | 'answer'
        'field_name',     // 'title' | 'quiz_description' | 'cover_image_url' | 'question_title' | 'question_description' | 'answer_text'
        'quiz_id', 'question_id', 'answer_id',
        'element_text',
    ];

    // Usefull scopes
    public function scopeLang($q, int $langId)  { return $q->where('lang', $langId); }
    public function scopeField($q, string $f)   { return $q->where('field_name', $f);   }
    public function scopeForQuiz($q, int $id)   { return $q->where('element_type','quiz')->where('quiz_id',$id); }
    public function scopeForQuestion($q, int $id){return $q->where('element_type','question')->where('question_id',$id); }
    public function scopeForAnswer($q, int $id) { return $q->where('element_type','answer')->where('answer_id',$id); }
}
