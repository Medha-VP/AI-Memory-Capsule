import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import IntValue "mo:caffeineai-oql/IntValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import List "mo:core/List";
import Types "types/documents";
import DocumentsApi "mixins/documents-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let docs : Map.Map<Nat, Types.Document>;
  let state : Types.DocumentsState;

  func categoryToText(c : Types.DocumentCategory) : Text {
    switch (c) {
      case (#education) { "education" };
      case (#identity) { "identity" };
      case (#finance) { "finance" };
      case (#insurance) { "insurance" };
      case (#projects) { "projects" };
      case (#achievements) { "achievements" };
    };
  };

  func hexDigit(n : Nat) : Text {
    if (n < 10) { n.toText() } else {
      switch (n) {
        case (10) { "a" };
        case (11) { "b" };
        case (12) { "c" };
        case (13) { "d" };
        case (14) { "e" };
        case _ { "f" };
      };
    };
  };

  func blobToHex(b : Blob) : Text {
    let bytes = b.toArray();
    let hex = List.empty<Text>();
    for (byte in bytes.values()) {
      let n = byte.toNat();
      hex.add(hexDigit(n / 16) # hexDigit(n % 16));
    };
    hex.toArray().values().join("");
  };

  transient let anyP = Principal.fromText("aaaaa-aa");

  include MixinAuthorization(accessControlState, null);
  include Expose({
    entities = [
      docs.toEntityManual("document", "Document", "id")
        .sample({
          id = 0;
          owner = anyP;
          name = "";
          fileType = "";
          uploadedAt = 0;
          blob = "\00";
          category = #projects;
          metadata = [];
          summary = null;
          passwordSalt = null;
          passwordHash = null;
        } : Types.Document)
        .payload("id", func d = d.id)
        .payload("owner", func d = d.owner)
        .payload("name", func d = d.name)
        .payload("fileType", func d = d.fileType)
        .payload("uploadedAt", func d = d.uploadedAt)
        .payload("category", func d = categoryToText(d.category))
        .payload("metadata", func d = d.metadata.values().join(", "))
        .payload("summary", func d = switch (d.summary) { case (?s) s; case null "" })
        .payload("passwordSalt", func d = switch (d.passwordSalt) { case (?s) blobToHex(s); case null "" })
        .payload("passwordHash", func d = switch (d.passwordHash) { case (?h) blobToHex(h); case null "" })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
  include MixinObjectStorage();
  include DocumentsApi(accessControlState, docs, state);
  include ApiDocMixin();
};
