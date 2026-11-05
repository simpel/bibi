// Swedish grammar and vocabulary transformations for Phase 1 and Phase 2.

/**
 * Swedish rules for Phase 1 (WorkOrder -> Körschema)
 */
export const SWEDISH_WORK_ORDER_PAIRS = [
  // Definitions
  { pattern: /Orderdefinitioner/g, replacement: "Körschemadefinitioner" },
  { pattern: /orderdefinitioner/g, replacement: "körschemadefinitioner" },
  { pattern: /Orderdefinition/g, replacement: "Körschemadefinition" },
  { pattern: /orderdefinition/g, replacement: "körschemadefinition" },

  // Multi-word phrases first
  { pattern: /Inga order hittades/g, replacement: "Inga körscheman hittades" },
  { pattern: /Med i order/g, replacement: "Med i körschema" },
  { pattern: /med i order/g, replacement: "med i körschema" },
  { pattern: /Rader tas med i order/g, replacement: "Rader tas med i körschema" },
  { pattern: /Öppna ordern/g, replacement: "Öppna körschemat" },
  { pattern: /öppna ordern/g, replacement: "öppna körschemat" },
  { pattern: /\ben order\b/g, replacement: "ett körschema" },
  { pattern: /\bEn order\b/g, replacement: "Ett körschema" },
  { pattern: /Köksordern/g, replacement: "Kökskörschemat" },
  { pattern: /köksordern/g, replacement: "kökskörschemat" },

  // Arbetsorder variants
  { pattern: /Arbetsordrarna/g, replacement: "Körschemana" },
  { pattern: /arbetsordrarna/g, replacement: "körschemana" },
  { pattern: /Arbetsordrar/g, replacement: "Körscheman" },
  { pattern: /arbetsordrar/g, replacement: "körscheman" },
  { pattern: /Arbetsordern/g, replacement: "Körschemat" },
  { pattern: /arbetsordern/g, replacement: "körschemat" },
  { pattern: /Arbetsorder/g, replacement: "Körschema" },
  { pattern: /arbetsorder/g, replacement: "körschema" },

  // Work order actions
  { pattern: /Skapa order/g, replacement: "Skapa körschema" },
  { pattern: /Uppdatera order/g, replacement: "Uppdatera körschema" },
  { pattern: /Arkivera order/g, replacement: "Arkivera körschema" },

  // Underlag (used for work orders in common.json / operations.json)
  { pattern: /"title":\s*"Underlag"/g, replacement: '"title": "Körschema"' },
  {
    pattern: /"title":\s*"Underlag som går rätt"/g,
    replacement: '"title": "Körscheman som når rätt"',
  },
  { pattern: /Ett underlag som köksordern/g, replacement: "Ett körschema som kökskörschemat" },
  { pattern: /ett underlag som köksordern/g, replacement: "ett körschema som kökskörschemat" },
  {
    pattern: /Versionerade underlag, till exempel köksorder/g,
    replacement: "Versionerade körscheman, till exempel kökskörschema",
  },
  {
    pattern: /versionerade underlag, till exempel köksorder/g,
    replacement: "versionerade körscheman, till exempel kökskörschema",
  },

  // JSON UI keys in Swedish
  { pattern: /"singular":\s*"Order"/g, replacement: '"singular": "Körschema"' },
  { pattern: /"plural":\s*"Order"/g, replacement: '"plural": "Körscheman"' },
  { pattern: /"workOrder":\s*"Order"/g, replacement: '"workOrder": "Körschema"' },
  { pattern: /"workOrders":\s*"Order"/g, replacement: '"workOrders": "Körscheman"' },
];

/**
 * Swedish rules for Phase 2 (Ticket -> Bokning)
 */
export const SWEDISH_TICKET_PAIRS = [
  // Multi-word / article compounds first (so "ett ärende" -> "en bokning", not "ett bokning")
  { pattern: /\bett ärende\b/g, replacement: "en bokning" },
  { pattern: /\bEtt ärende\b/g, replacement: "En bokning" },
  { pattern: /\bvarje ärende\b/g, replacement: "varje bokning" },
  { pattern: /\bVarje ärende\b/g, replacement: "Varje bokning" },
  { pattern: /\bdetta ärende\b/g, replacement: "denna bokning" },
  { pattern: /\bDetta ärende\b/g, replacement: "Denna bokning" },
  { pattern: /\bsitt ärende\b/g, replacement: "sin bokning" },
  { pattern: /\bSitt ärende\b/g, replacement: "Sin bokning" },
  { pattern: /\bnytt ärende\b/g, replacement: "ny bokning" },
  { pattern: /\bNytt ärende\b/g, replacement: "Ny bokning" },
  { pattern: /\ben biljett\b/g, replacement: "en bokning" },
  { pattern: /\bEn biljett\b/g, replacement: "En bokning" },

  // Statuses
  { pattern: /Ärendestatusarna/g, replacement: "Bokningsstatusarna" },
  { pattern: /ärendestatusarna/g, replacement: "bokningsstatusarna" },
  { pattern: /Ärendestatusar/g, replacement: "Bokningsstatusar" },
  { pattern: /ärendestatusar/g, replacement: "bokningsstatusar" },
  { pattern: /Ärendestatusen/g, replacement: "Bokningsstatusen" },
  { pattern: /ärendestatusen/g, replacement: "bokningsstatusen" },
  { pattern: /Ärendestatus/g, replacement: "Bokningsstatus" },
  { pattern: /ärendestatus/g, replacement: "bokningsstatus" },

  // Templates
  { pattern: /Ärendemallarna/g, replacement: "Bokningsmallarna" },
  { pattern: /ärendemallarna/g, replacement: "bokningsmallarna" },
  { pattern: /Ärendemallar/g, replacement: "Bokningsmallar" },
  { pattern: /ärendemallar/g, replacement: "bokningsmallar" },
  { pattern: /Ärendemallen/g, replacement: "Bokningsmallen" },
  { pattern: /ärendemallen/g, replacement: "bokningsmallen" },
  { pattern: /Ärendemall/g, replacement: "Bokningsmall" },
  { pattern: /ärendemall/g, replacement: "bokningsmall" },

  // Types
  { pattern: /Ärendetyperna/g, replacement: "Bokningstyperna" },
  { pattern: /ärendetyperna/g, replacement: "bokningstyperna" },
  { pattern: /Ärendetyper/g, replacement: "Bokningstyper" },
  { pattern: /ärendetyper/g, replacement: "bokningstyper" },
  { pattern: /Ärendetypen/g, replacement: "Bokningstypen" },
  { pattern: /ärendetypen/g, replacement: "bokningstypen" },
  { pattern: /Ärendetyp/g, replacement: "Bokningstyp" },
  { pattern: /ärendetyp/g, replacement: "bokningstyp" },

  // Lines & Numbers & Drafts
  { pattern: /Ärenderader/g, replacement: "Bokningsrader" },
  { pattern: /ärenderader/g, replacement: "bokningsrader" },
  { pattern: /Ärenderad/g, replacement: "Bokningsrad" },
  { pattern: /ärenderad/g, replacement: "bokningsrad" },
  { pattern: /Ärendenummer/g, replacement: "Bokningsnummer" },
  { pattern: /ärendenummer/g, replacement: "bokningsnummer" },
  { pattern: /Ärendeutkast/g, replacement: "Bokningsutkast" },
  { pattern: /ärendeutkast/g, replacement: "bokningsutkast" },

  // Genitives
  { pattern: /Ärendenas/g, replacement: "Bokningarnas" },
  { pattern: /ärendenas/g, replacement: "bokningarnas" },
  { pattern: /Ärendens/g, replacement: "Bokningars" },
  { pattern: /ärendens/g, replacement: "bokningars" },
  { pattern: /Ärendets/g, replacement: "Bokningens" },
  { pattern: /ärendets/g, replacement: "bokningens" },
  { pattern: /Ärendes/g, replacement: "Boknings" },
  { pattern: /ärendes/g, replacement: "boknings" },

  // Plural definite & indefinite
  { pattern: /Ärendena/g, replacement: "Bokningarna" },
  { pattern: /ärendena/g, replacement: "bokningarna" },
  { pattern: /Ärenden/g, replacement: "Bokningar" },
  { pattern: /ärenden/g, replacement: "bokningar" },

  // Singular definite & indefinite
  { pattern: /Ärendet/g, replacement: "Bokningen" },
  { pattern: /ärendet/g, replacement: "bokningen" },
  { pattern: /Ärende/g, replacement: "Bokning" },
  { pattern: /ärende/g, replacement: "bokning" },

  // "biljett" occurrence
  { pattern: /\bbiljetten\b/g, replacement: "bokningen" },
  { pattern: /\bBiljetten\b/g, replacement: "Bokningen" },
  { pattern: /\bbiljetter\b/g, replacement: "bokningar" },
  { pattern: /\bBiljetter\b/g, replacement: "Bokningar" },
  { pattern: /\bbiljett\b/g, replacement: "bokning" },
  { pattern: /\bBiljett\b/g, replacement: "Bokning" },
];
