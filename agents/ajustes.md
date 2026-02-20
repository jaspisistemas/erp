// remover .aspx de rotlink
update rotina set rotlink = replace(rotlink,'.aspx','')

// Lista toda as rotinas que não estão no modulo ACESSORESTRITO
select distinct RotLink from rotina r
join RotinaModulo rm on r.rotcod = rm.RotCod
join Modulo m on m.modcod = rm.RotModCod
where ModNom <> 'ACESSORESTRITO'