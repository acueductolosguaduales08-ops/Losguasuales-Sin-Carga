-- ============================================================
-- 10 IMPORTAR ASOCIADOS (40 filas del listado vereda Santa Bárbara)
-- Ejecutar en el proyecto NUEVO. Idempotente: si se repite, omite existentes.
-- Nombres: última palabra = apellidos, resto = nombres.
-- SIN-MEDIDOR-*: no crean medidor (sin medidor físico).
-- ============================================================

insert into public.asociados
  (codigo_interno, tipo_documento, documento, nombres, apellidos, telefono_principal, correo, direccion, barrio_vereda, observaciones, estado_servicio, fecha_afiliacion, archivado)
values
  ('ASO-00001', 'CC', '1', 'OMAR LORENZO', 'MASO', '3001000001', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00002', 'CC', '2', 'AMPARO', 'AGUDELO', '3001000002', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00003', 'CC', '3', 'ANDREA', 'GONZALEZ', '3001000003', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00004', 'CC', '4', 'BERTA MIRIAM', 'CARDONA', '3001000004', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00005', 'CC', '5', 'CLARA', 'VALENCIA', '3001000005', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00006', 'CC', '6', 'CRISTINA', 'DIEZ', '3001000006', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00007', 'CC', '7', 'DAIRON', 'BLANDON', '3001000007', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00008', 'CC', '8', 'DEBORA', 'VALENCIA', '3001000008', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00009', 'CC', '9', 'DIANA MARCELA', 'JIMENEZ', '3001000009', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00010', 'CC', '10', 'DERLY', 'VASQUEZ', '3001000010', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00011', 'CC', '11', 'DIEGO MEJIA', 'MONTOYA', '3001000011', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00012', 'CC', '12', 'DIEGO', 'SALAZAR', '3001000012', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00013', 'CC', '13', 'DORA MARIA', 'HOLGIN', '3001000013', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00014', 'CC', '14', 'EDUARDO', 'VELEZ', '3001000014', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00015', 'CC', '15', 'EFRAIN', 'CASTANEDA', '3001000015', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00016', 'CC', '16', 'FINCA LOS', 'PRIMOS', '3001000016', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00017', 'CC', '17', 'FREDY', 'ROJAS', '3001000017', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00018', 'CC', '18', 'GONZALO', 'SANCHEZ', '3001000018', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00019', 'CC', '19', 'GUILLERMO', 'MESA', '3001000019', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00020', 'CC', '20', 'GUSTAVO', 'VILLEGAS', '3001000020', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00021', 'CC', '22', 'HUGO', 'LOPEZ', '3001000022', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00022', 'CC', '23', 'JAIR', 'SALAZAR', '3001000023', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00023', 'CC', '24', 'JHON ALEXANDER', 'OSPINA', '3001000024', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00024', 'CC', '25', 'JHON JAIRO', 'TABARES', '3001000025', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00025', 'CC', '26', 'JORGE ENRIQUE', 'ZAMUDIO', '3001000026', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00026', 'CC', '27', 'JUAN CAMILO', 'CARDONA', '3001000027', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00027', 'CC', '28', 'JUAN CARLOS', 'HENAO', '3001000028', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00028', 'CC', '8070469', 'JUAN DAVID', 'BAENA', '3197572008', null, 'TRILOGIA Divina', 'Loma de Don Santos', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00029', 'CC', '30', 'KEVIN', 'MESA', '3001000030', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00030', 'CC', '31', 'LAURA', 'MORALES', '3001000031', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00031', 'CC', '32', 'LAURA PAOLA', 'HERRERA', '3001000032', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00032', 'CC', '33', 'LEON JAIRO GARCES', 'GAVIRIA', '3001000033', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00033', 'CC', '34', 'LUIS FERNANDO', 'CASTANEDA', '3001000034', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00034', 'CC', '35', 'MILEYDI VELEZ', 'RESTREPO', '3001000035', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00035', 'CC', '36', 'MOISES', 'GUZMAN', '3001000036', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00036', 'CC', '37', 'NORBEYDA', 'MORENO', '3001000037', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00037', 'CC', '38', 'OSCAR', 'SALAZAR', '3001000038', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00038', 'CC', '39', 'SAMUEL', 'LOPEZ', '3001000039', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00039', 'CC', '21', 'HORACIO ALBERTO', 'SERNA', '3001000021', null, 'Loma de Don Santos', 'Santabarbara', null, 'ACTIVO', '2024-01-01', false),
  ('ASO-00040', 'CC', '1041351286', 'Prueba', 'Asociado', '300001234', null, 'Ejeplo', null, null, 'INACTIVO', '2026-08-26', false)
on conflict (documento) do nothing;

-- Medidores reales vinculados por documento
insert into public.medidores (numero, asociado_id, estado)
  values
  ('2023091469', (select id from public.asociados where documento = '2'), 'ACTIVO'),
  ('2023052483', (select id from public.asociados where documento = '4'), 'ACTIVO'),
  ('J21LA330975', (select id from public.asociados where documento = '5'), 'ACTIVO'),
  ('J21LA330977', (select id from public.asociados where documento = '6'), 'ACTIVO'),
  ('J21LA330978', (select id from public.asociados where documento = '7'), 'ACTIVO'),
  ('J21LA334705', (select id from public.asociados where documento = '8'), 'ACTIVO'),
  ('J21LA330971', (select id from public.asociados where documento = '11'), 'ACTIVO'),
  ('J21LA330969', (select id from public.asociados where documento = '12'), 'ACTIVO'),
  ('23/049248', (select id from public.asociados where documento = '13'), 'ACTIVO'),
  ('J21LA328533', (select id from public.asociados where documento = '17'), 'ACTIVO'),
  ('J21LA330976', (select id from public.asociados where documento = '18'), 'ACTIVO'),
  ('J21LA330961', (select id from public.asociados where documento = '19'), 'ACTIVO'),
  ('J21LA330968', (select id from public.asociados where documento = '20'), 'ACTIVO'),
  ('J21LA330966', (select id from public.asociados where documento = '23'), 'ACTIVO'),
  ('J21LA328533-2', (select id from public.asociados where documento = '24'), 'ACTIVO'),
  ('J21LA328533-3', (select id from public.asociados where documento = '25'), 'ACTIVO'),
  ('J21LA330967', (select id from public.asociados where documento = '27'), 'ACTIVO'),
  ('J21LA330967-2', (select id from public.asociados where documento = '28'), 'ACTIVO'),
  ('J21LA330965', (select id from public.asociados where documento = '8070469'), 'ACTIVO'),
  ('J21LA330964', (select id from public.asociados where documento = '30'), 'ACTIVO'),
  ('J21LA330960', (select id from public.asociados where documento = '33'), 'ACTIVO'),
  ('J21LA334704', (select id from public.asociados where documento = '37'), 'ACTIVO'),
  ('J21LA330974', (select id from public.asociados where documento = '38'), 'ACTIVO'),
  ('J21LA334703', (select id from public.asociados where documento = '39'), 'ACTIVO'),
  ('J21LA330963', (select id from public.asociados where documento = '21'), 'ACTIVO'),
  ('123medidordeejemplo', (select id from public.asociados where documento = '1041351286'), 'ACTIVO')
on conflict (numero) do nothing;

-- Avanza el consecutivo de códigos para no repetir
update public.configuracion set siguiente_codigo_asociado = greatest(siguiente_codigo_asociado, 41) where id = 1;

-- Verificación
select count(*) as asociados from public.asociados;
select count(*) as medidores from public.medidores;
