<?php

function resolveLangId(PDO $db, string $langCode): int {
    $q = $db->prepare("SELECT id FROM lang WHERE lang = :c LIMIT 1");
    $q->execute([':c'=>$langCode]);
    $id = $q->fetchColumn();
    if (!$id) { throw new RuntimeException("Unknown lang code : ".$langCode); }
    return (int)$id;
}

function upsertQuizTranslation(PDO $db, int $langId, int $quizId, string $field, string $text): void {
    $sql = "INSERT INTO translations (lang, element_type, field_name, element_id, element_text)
            VALUES (:lang, 'quiz', :field, :id, :txt)
            ON DUPLICATE KEY UPDATE element_text = VALUES(element_text), updated_at = CURRENT_TIMESTAMP";
    $db->prepare($sql)->execute([':lang'=>$langId, ':field'=>$field, ':id'=>$quizId, ':txt'=>$text]);
}

function upsertQuestionTranslation(PDO $db, int $langId, int $questionId, string $field, ?string $text): void {
    $sql = "INSERT INTO translations (lang, element_type, field_name, element_id, element_text)
            VALUES (:lang, 'question', :field, :id, :txt)
            ON DUPLICATE KEY UPDATE element_text = VALUES(element_text), updated_at = CURRENT_TIMESTAMP";
    $db->prepare($sql)->execute([':lang'=>$langId, ':field'=>$field, ':id'=>$questionId, ':txt'=>($text ?? '')]);
}

function upsertAnswerTranslation(PDO $db, int $langId, int $answerId, string $text): void {
    $sql = "INSERT INTO translations (lang, element_type, field_name, element_id, element_text)
            VALUES (:lang, 'answer', 'answer_text', :id, :txt)
            ON DUPLICATE KEY UPDATE element_text = VALUES(element_text), updated_at = CURRENT_TIMESTAMP";
    $db->prepare($sql)->execute([':lang'=>$langId, ':id'=>$answerId, ':txt'=>$text]);
}

function upsertActiveQuiz(PDO $db, int $quizId, int $langId, bool $isActive): void {
    $sql = "INSERT INTO active_quiz (id_quiz, lang, is_active)
            VALUES (:q, :l, :a)
            ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), updated_at = CURRENT_TIMESTAMP";
    $db->prepare($sql)->execute([':q'=>$quizId, ':l'=>$langId, ':a'=>($isActive ? 1 : 0)]);
}
