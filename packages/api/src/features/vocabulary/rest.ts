import { restRoute } from "../../rest-route";

export const vocabularyRoutes = [
  restRoute({ operation: "vocabulary.list", method: "GET", path: "/vocabularies" }),
  restRoute({ operation: "vocabulary.get", method: "GET", path: "/vocabularies/{id}" }),
  restRoute({ operation: "vocabulary.create", method: "POST", path: "/vocabularies" }),
  restRoute({ operation: "vocabulary.update", method: "PATCH", path: "/vocabularies/{id}" }),
  restRoute({ operation: "vocabulary.archive", method: "DELETE", path: "/vocabularies/{id}" }),
  restRoute({
    operation: "vocabulary.importTemplate",
    method: "POST",
    path: "/vocabularies/import-template",
  }),
  restRoute({
    operation: "vocabulary.addValue",
    method: "POST",
    path: "/vocabularies/{vocabularyId}/values",
  }),
  restRoute({
    operation: "vocabulary.updateValue",
    method: "PATCH",
    path: "/vocabulary-values/{id}",
  }),
  restRoute({
    operation: "vocabulary.archiveValue",
    method: "DELETE",
    path: "/vocabulary-values/{id}",
  }),
];
