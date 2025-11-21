<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Translation extends Model
{
    protected $table = 'translations';
    protected $primaryKey = 'id_translation';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'lang',
        'element_type',
        'field_name',
        'element_id',
        'element_text',
    ];

    // Usefull scopes
    public function scopeLang($q, int $langId)  { return $q->where('lang', $langId); }
    public function scopeField($q, string $f)   { return $q->where('field_name', $f);   }
    public function scopeForQuiz($q, int $id)   { return $q->where('element_type','quiz')->where('element_id',$id); }
    public function scopeForQuestion($q, int $id){return $q->where('element_type','question')->where('element_id',$id); }
    public function scopeForAnswer($q, int $id) { return $q->where('element_type','answer')->where('element_id',$id); }
}
