-- Seed 3 default templates
-- These are inserted for the first company found in the database

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  SELECT id INTO v_user_id FROM users WHERE company_id = v_company_id LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE NOTICE 'No company found, skipping template seeds';
    RETURN;
  END IF;

  -- 1. Attestation de travail
  INSERT INTO templates (company_id, name, category, language, body, variable_schema, status, version, created_by)
  VALUES (
    v_company_id,
    'Attestation de travail',
    'attestation',
    'fr',
    '<h1>ATTESTATION DE TRAVAIL</h1>

<p>Je soussigné(e), <strong>{{company.name}}</strong>, dont le siège social est situé au <strong>{{company.address}}</strong>, atteste par la présente que :</p>

<p><strong>{{employee.fullName}}</strong>, titulaire de la CIN n° <strong>{{employee.cin}}</strong>, est employé(e) au sein de notre entreprise depuis le <strong>{{formatDate employee.hireDate}}</strong>.</p>

<p>Il/Elle occupe actuellement le poste de <strong>{{employee.function}}</strong> au sein du département <strong>{{employee.department}}</strong>, sous contrat <strong>{{employee.contractType}}</strong>.</p>

<p>La présente attestation est délivrée à l''intéressé(e) pour servir et valoir ce que de droit{{#if form.purpose}}, notamment pour <strong>{{form.purpose}}</strong>{{/if}}.</p>

<div class="signature-zone">
  <div class="signature-block">
    <div class="signature-line">Signature et cachet de l''entreprise</div>
  </div>
  <div class="signature-block">
    <div class="signature-line">Fait à ____________, le {{meta.generatedAtLong}}</div>
  </div>
</div>',
    '[
      {"name": "employee.fullName", "label": "Nom complet", "type": "text", "required": true, "autoFill": true},
      {"name": "employee.cin", "label": "CIN", "type": "text", "required": false, "autoFill": true},
      {"name": "employee.function", "label": "Fonction", "type": "text", "required": true, "autoFill": true},
      {"name": "employee.department", "label": "Département", "type": "text", "required": true, "autoFill": true},
      {"name": "employee.hireDate", "label": "Date d''embauche", "type": "date", "required": true, "autoFill": true},
      {"name": "employee.contractType", "label": "Type de contrat", "type": "text", "required": true, "autoFill": true},
      {"name": "form.purpose", "label": "Motif de la demande", "type": "text", "required": false, "autoFill": false}
    ]'::jsonb,
    'active',
    1,
    v_user_id
  ) ON CONFLICT DO NOTHING;

  -- 2. Attestation de salaire
  INSERT INTO templates (company_id, name, category, language, body, variable_schema, status, version, created_by)
  VALUES (
    v_company_id,
    'Attestation de salaire',
    'attestation',
    'fr',
    '<h1>ATTESTATION DE SALAIRE</h1>

<p>Je soussigné(e), <strong>{{company.name}}</strong>, dont le siège social est situé au <strong>{{company.address}}</strong>, atteste par la présente que :</p>

<p><strong>{{employee.fullName}}</strong>, titulaire de la CIN n° <strong>{{employee.cin}}</strong>, occupe le poste de <strong>{{employee.function}}</strong> au sein de notre entreprise depuis le <strong>{{formatDate employee.hireDate}}</strong>.</p>

<p>Son salaire mensuel brut s''élève à <strong>{{formatCurrency employee.salary}}</strong>.</p>

{{#if form.requestedBy}}
<p>La présente attestation est délivrée à la demande de l''intéressé(e) pour être remise à <strong>{{form.requestedBy}}</strong>.</p>
{{/if}}

<p>Fait pour servir et valoir ce que de droit.</p>

<div class="signature-zone">
  <div class="signature-block">
    <div class="signature-line">Signature et cachet de l''entreprise</div>
  </div>
  <div class="signature-block">
    <div class="signature-line">Fait le {{meta.generatedAtLong}}</div>
  </div>
</div>',
    '[
      {"name": "employee.fullName", "label": "Nom complet", "type": "text", "required": true, "autoFill": true},
      {"name": "employee.cin", "label": "CIN", "type": "text", "required": false, "autoFill": true},
      {"name": "employee.function", "label": "Fonction", "type": "text", "required": true, "autoFill": true},
      {"name": "employee.hireDate", "label": "Date d''embauche", "type": "date", "required": true, "autoFill": true},
      {"name": "employee.salary", "label": "Salaire", "type": "currency", "required": true, "autoFill": true},
      {"name": "form.requestedBy", "label": "Destinataire", "type": "text", "required": true, "autoFill": false}
    ]'::jsonb,
    'active',
    1,
    v_user_id
  ) ON CONFLICT DO NOTHING;

  -- 3. Contrat de travail CDI
  INSERT INTO templates (company_id, name, category, language, body, variable_schema, status, version, created_by)
  VALUES (
    v_company_id,
    'Contrat de travail CDI',
    'contract',
    'fr',
    '<h1>CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE</h1>

<p><strong>Entre les soussignés :</strong></p>

<p><strong>L''Employeur :</strong> <strong>{{company.name}}</strong>, dont le siège social est situé au {{company.address}}, ci-après dénommé « l''Employeur »,</p>

<p><strong>Et :</strong></p>

<p><strong>Le Salarié :</strong> <strong>{{employee.fullName}}</strong>, titulaire de la CIN n° {{employee.cin}}, demeurant au {{employee.address}}, ci-après dénommé(e) « le Salarié »,</p>

<h2>Article 1 — Objet du contrat</h2>
<p>Le présent contrat est conclu pour une durée indéterminée. Le Salarié est embauché(e) en qualité de <strong>{{employee.function}}</strong> au sein du département <strong>{{employee.department}}</strong>.</p>

<h2>Article 2 — Date d''effet</h2>
<p>Le présent contrat prend effet à compter du <strong>{{formatDate employee.hireDate}}</strong>.</p>

<h2>Article 3 — Période d''essai</h2>
<p>Le Salarié est soumis à une période d''essai de <strong>{{form.trialPeriod}} mois</strong>, renouvelable une fois pour la même durée.</p>

<h2>Article 4 — Lieu de travail</h2>
<p>Le lieu habituel de travail est fixé à <strong>{{form.workLocation}}</strong>. L''Employeur se réserve le droit de modifier ce lieu dans un rayon raisonnable.</p>

<h2>Article 5 — Rémunération</h2>
<p>En contrepartie de ses services, le Salarié percevra un salaire mensuel brut de <strong>{{formatCurrency employee.salary}}</strong>, payable à terme échu.</p>

<h2>Article 6 — Durée du travail</h2>
<p>La durée hebdomadaire de travail est fixée conformément à la législation en vigueur, soit 44 heures par semaine.</p>

<h2>Article 7 — Congés payés</h2>
<p>Le Salarié bénéficie d''un congé annuel payé de 18 jours ouvrables, conformément au Code du Travail marocain.</p>

<h2>Article 8 — Obligations du salarié</h2>
<p>Le Salarié s''engage à exercer ses fonctions avec diligence et loyauté, et à respecter le règlement intérieur de l''entreprise.</p>

<h2>Article 9 — Résiliation</h2>
<p>Le contrat peut être résilié par l''une ou l''autre des parties moyennant un préavis conforme à la législation en vigueur.</p>

<p>Fait en deux exemplaires originaux, un pour chaque partie.</p>

<div class="signature-zone">
  <div class="signature-block">
    <div class="signature-line">L''Employeur</div>
  </div>
  <div class="signature-block">
    <div class="signature-line">Le Salarié</div>
  </div>
</div>',
    '[
      {"name": "employee.fullName", "label": "Nom complet", "type": "text", "required": true, "autoFill": true},
      {"name": "employee.cin", "label": "CIN", "type": "text", "required": false, "autoFill": true},
      {"name": "employee.address", "label": "Adresse du salarié", "type": "text", "required": false, "autoFill": true},
      {"name": "employee.function", "label": "Fonction", "type": "text", "required": true, "autoFill": true},
      {"name": "employee.department", "label": "Département", "type": "text", "required": true, "autoFill": true},
      {"name": "employee.hireDate", "label": "Date d''embauche", "type": "date", "required": true, "autoFill": true},
      {"name": "employee.salary", "label": "Salaire mensuel brut", "type": "currency", "required": true, "autoFill": true},
      {"name": "form.trialPeriod", "label": "Période d''essai (mois)", "type": "number", "required": true, "autoFill": false, "defaultValue": "3"},
      {"name": "form.workLocation", "label": "Lieu de travail", "type": "text", "required": true, "autoFill": false}
    ]'::jsonb,
    'active',
    1,
    v_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seeded 3 default templates successfully';
END $$;
