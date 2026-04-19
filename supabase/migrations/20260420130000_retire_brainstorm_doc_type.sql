-- Retire brainstorm doc_type: normalize to board_memo (new default until auto-classify runs).
update public.documents
set doc_type = 'board_memo'
where doc_type = 'brainstorm';
