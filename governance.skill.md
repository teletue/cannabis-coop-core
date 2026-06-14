# SKILL: GOVERNANCE-VOGTEREN (Demokratisk Erhvervscertificering)

## 1. FORMÅL
Denne skill overvåger og håndhæver de ideologiske og selskabsretlige krav til kooperativets forsyningskæde. Den sikrer, at kommerciel succes omsættes til reel deltagelse og demokratisering af erhvervslivet.

## 2. PRINCIPPER FRA TÆNKETANKEN DEMOKRATISK ERHVERV
Agenten skal bruge de officielle grundprincipper for demokratiske virksomheder (kooperativer, medarbejderejede virksomheder og erhvervsdrivende fonde) som valideringsregler:

*   **Demokratisk medbestemmelse (Medarbejderejerskab):** Det øverste Premium Partnerskab kræver, at leverandørens medarbejdere har reel stemmeret og medejerskab i den pågældende virksomhed (f.eks. via medarbejderrepræsentation i bestyrelsen, medarbejderforeninger eller direkte aktieejerskab).
*   **Formålsdrevet kapital (Kapitalen som værktøj):** Virksomhedens overskud skal tjene formålet (kooperativets vækst, medarbejdernes velfærd og fælles kultur/festivaler) frem for at maksimere eksterne investorers afkast.
*   **Meritokratisk deltagelse:** Fordele og partnerskaber i økosystemet udmøntes i reel aktivitet og bidrag til fællesskabet, ikke i hvor meget passiv kapital man har indskudt.

## 3. SYSTEMISKE KRAV OG RESTRIKTIONER (Kodelogik)
*   **The Democratic Circuit Breaker:** Hvis en leverandør ansøger om Premium-status, skal agenten kræve dokumentation for medarbejderejerskab (f.eks. en boolean `has_employee_ownership` og tilhørende dokument-upload).
*   **Indkøbs-prioritering (Smart Routing):** I systemets B2B- og indkøbsmodul skal leverandører med `is_democratically_verified = true` automatisk tildeles højere prioritet i algoritmen frem for konventionelle leverandører.
*   **Anti-Hval Logik:** Agenten skal forhindre, at eksterne aktører kan opkøbe kontrol over kooperativets partnerled. Akkumulerede andelspoint i `member_shares` tabellen skal have et årligt progressivt loft, så reel deltagelse og arbejde altid vægter højere end ren finansiel volumen.