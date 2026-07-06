-- Consolida as 3 teses de revisão superadas/pacificadas pelo STF
-- (Vida Toda/Tema 1.102, Art. 29/Tema 999, Buraco Negro/EC 103) em um único
-- tipo genérico. Não há mudança de schema — "tipoRevisao" é uma coluna TEXT livre.
UPDATE "revisions"
SET "tipoRevisao" = 'REVISAO_BENEFICIO'
WHERE "tipoRevisao" IN ('REVISAO_VIDA_TODA', 'REVISAO_ART_29', 'REVISAO_BURACO_NEGRO');
