import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Result "mo:core/Result";
import Random "mo:core/Random";
import AccessControl "mo:caffeineai-authorization/access-control";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/documents";
import DocumentsLib "../lib/documents";

mixin (
  accessControlState : AccessControl.AccessControlState,
  docs : Map.Map<Nat, Types.Document>,
  state : Types.DocumentsState,
) {
  public query ({ caller }) func listDocuments() : async [Types.DocumentView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    DocumentsLib.listDocuments(docs, caller);
  };

  public query ({ caller }) func getDocument(id : Nat, password : ?Text) : async ?Types.DocumentView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    DocumentsLib.getDocument(docs, caller, id, password);
  };

  public shared ({ caller }) func uploadDocument(name : Text, fileType : Text, blob : Storage.ExternalBlob, password : ?Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let salt = switch (password) {
      case (?p) { ?(await Random.blob()) };
      case null { null };
    };
    let hash = switch (salt, password) {
      case (?s, ?p) { ?DocumentsLib.hashPassword(s, p) };
      case _ { null };
    };
    let doc : Types.Document = {
      id = 0;
      owner = caller;
      name;
      fileType;
      uploadedAt = Time.now();
      blob;
      category = DocumentsLib.classifyDocument(name, fileType, []);
      metadata = [];
      summary = null;
      passwordSalt = salt;
      passwordHash = hash;
    };
    DocumentsLib.addDocument(docs, state, caller, doc);
  };

  public shared ({ caller }) func deleteDocument(id : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    DocumentsLib.deleteDocument(docs, caller, id);
  };

  public query ({ caller }) func searchDocuments(searchText : Text) : async [Types.DocumentView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    DocumentsLib.searchDocuments(docs, caller, searchText);
  };

  public query ({ caller }) func getAnalyticsOverview() : async Types.AnalyticsOverview {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    DocumentsLib.getAnalyticsOverview(docs, caller);
  };

  public query ({ caller }) func getUploadTrends() : async [Types.UploadTrendPoint] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    DocumentsLib.getUploadTrends(docs, caller);
  };

  public query ({ caller }) func getKnowledgeGraph() : async Types.KnowledgeGraph {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    DocumentsLib.getKnowledgeGraph(docs, caller);
  };

  public shared ({ caller }) func setDocumentPassword(id : Nat, password : Text) : async Result.Result<(), Types.PasswordError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    await DocumentsLib.setDocumentPassword(docs, caller, id, password);
  };

  public shared ({ caller }) func changeDocumentPassword(id : Nat, password : Text) : async Result.Result<(), Types.PasswordError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    await DocumentsLib.changeDocumentPassword(docs, caller, id, password);
  };

  public shared ({ caller }) func removeDocumentPassword(id : Nat) : async Result.Result<(), Types.PasswordError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    DocumentsLib.removeDocumentPassword(docs, caller, id);
  };

  public query ({ caller }) func verifyDocumentPassword(id : Nat, password : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    DocumentsLib.verifyDocumentPassword(docs, id, password);
  };
};
