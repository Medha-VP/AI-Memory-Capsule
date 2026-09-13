import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import List "mo:core/List";
import Result "mo:core/Result";
import Blob "mo:core/Blob";
import Random "mo:core/Random";
import Sha256 "mo:sha2/Sha256";
import Types "../types/documents";

module {
  public func listDocuments(docs : Map.Map<Nat, Types.Document>, owner : Principal) : [Types.DocumentView] {
    let views = List.empty<Types.DocumentView>();
    for ((_, d) in docs.entries()) {
      if (d.owner == owner) {
        views.add(toView(d, owner, false));
      };
    };
    views.toArray();
  };

  public func getDocument(docs : Map.Map<Nat, Types.Document>, viewer : Principal, id : Nat, password : ?Text) : ?Types.DocumentView {
    switch (docs.get(id)) {
      case null { null };
      case (?d) {
        let verified = switch (password) {
          case (?p) { verifyDocumentPassword(docs, id, p) };
          case null { false };
        };
        ?toView(d, viewer, verified);
      };
    };
  };

  public func addDocument(docs : Map.Map<Nat, Types.Document>, state : Types.DocumentsState, owner : Principal, doc : Types.Document) : Nat {
    let id = state.nextId;
    state.nextId += 1;
    docs.add(id, { doc with id; owner });
    id;
  };

  public func deleteDocument(docs : Map.Map<Nat, Types.Document>, owner : Principal, id : Nat) : Bool {
    switch (docs.get(id)) {
      case (?d) {
        if (d.owner == owner) {
          docs.remove(id);
          true;
        } else { false };
      };
      case null { false };
    };
  };

  public func searchDocuments(docs : Map.Map<Nat, Types.Document>, owner : Principal, searchText : Text) : [Types.DocumentView] {
    let q = searchText.toLower();
    let views = List.empty<Types.DocumentView>();
    for ((_, d) in docs.entries()) {
      if (d.owner == owner and matches(d, q)) {
        views.add(toView(d, owner, false));
      };
    };
    views.toArray();
  };

  public func setDocumentPassword(docs : Map.Map<Nat, Types.Document>, owner : Principal, id : Nat, password : Text) : async Result.Result<(), Types.PasswordError> {
    switch (docs.get(id)) {
      case null { #err(#notFound) };
      case (?d) {
        if (d.owner != owner) {
          #err(#notOwner);
        } else if (d.passwordHash != null) {
          #err(#alreadySet);
        } else {
          let salt = await Random.blob();
          let hash = hashPassword(salt, password);
          docs.add(id, { d with passwordSalt = ?salt; passwordHash = ?hash });
          #ok(());
        };
      };
    };
  };

  public func changeDocumentPassword(docs : Map.Map<Nat, Types.Document>, owner : Principal, id : Nat, password : Text) : async Result.Result<(), Types.PasswordError> {
    switch (docs.get(id)) {
      case null { #err(#notFound) };
      case (?d) {
        if (d.owner != owner) {
          #err(#notOwner);
        } else if (d.passwordHash == null) {
          #err(#noPassword);
        } else {
          let salt = await Random.blob();
          let hash = hashPassword(salt, password);
          docs.add(id, { d with passwordSalt = ?salt; passwordHash = ?hash });
          #ok(());
        };
      };
    };
  };

  public func removeDocumentPassword(docs : Map.Map<Nat, Types.Document>, owner : Principal, id : Nat) : Result.Result<(), Types.PasswordError> {
    switch (docs.get(id)) {
      case null { #err(#notFound) };
      case (?d) {
        if (d.owner != owner) {
          #err(#notOwner);
        } else if (d.passwordHash == null) {
          #err(#noPassword);
        } else {
          docs.add(id, { d with passwordSalt = null; passwordHash = null });
          #ok(());
        };
      };
    };
  };

  public func verifyDocumentPassword(docs : Map.Map<Nat, Types.Document>, id : Nat, password : Text) : Bool {
    switch (docs.get(id)) {
      case null { false };
      case (?d) {
        switch (d.passwordSalt, d.passwordHash) {
          case (?salt, ?hash) { hashPassword(salt, password) == hash };
          case _ { false };
        };
      };
    };
  };

  public func hashPassword(salt : Blob, password : Text) : Blob {
    let combined = salt.toArray().concat(password.encodeUtf8().toArray());
    Sha256.fromArray(combined);
  };

  public func classifyDocument(name : Text, fileType : Text, metadata : [Text]) : Types.DocumentCategory {
    ignore metadata;
    let n = name.toLower();
    let t = fileType.toLower();
    if (containsAny(n, ["transcript", "diploma", "degree", "certificate", "course", "school", "university", "education", "exam", "grade", "study", "class", "syllabus"])) {
      #education
    } else if (containsAny(n, ["passport", "identity", "id card", "license", "driver", "national", "birth", "visa", "aadhaar", "ssn", "social security", "voter"]) or t == "png" or t == "jpg" or t == "jpeg") {
      #identity
    } else if (containsAny(n, ["bank", "statement", "tax", "invoice", "receipt", "salary", "pay", "finance", "loan", "credit", "investment", "budget", "expense", "transaction", "mortgage", "account"]) or t == "xlsx" or t == "csv") {
      #finance
    } else if (containsAny(n, ["insurance", "policy", "claim", "coverage", "health", "medical", "premium", "benefit"])) {
      #insurance
    } else if (containsAny(n, ["project", "proposal", "report", "plan", "portfolio", "resume", "cv", "work", "contract", "brief", "roadmap"])) {
      #projects
    } else if (containsAny(n, ["award", "achievement", "medal", "honor", "prize", "recognition", "accomplishment", "trophy", "commendation"])) {
      #achievements
    } else {
      #projects
    };
  };

  public func getAnalyticsOverview(docs : Map.Map<Nat, Types.Document>, owner : Principal) : Types.AnalyticsOverview {
    let categories = [#education, #identity, #finance, #insurance, #projects, #achievements];
    var total = 0;
    let counts = List.empty<Types.CategoryCount>();
    for (cat in categories.values()) {
      var count = 0;
      for ((_, d) in docs.entries()) {
        if (d.owner == owner and d.category == cat) {
          count += 1;
        };
      };
      total += count;
      counts.add({ category = cat; count });
    };
    { totalDocuments = total; byCategory = counts.toArray() };
  };

  public func getUploadTrends(docs : Map.Map<Nat, Types.Document>, owner : Principal) : [Types.UploadTrendPoint] {
    let byDay = Map.empty<Text, Nat>();
    for ((_, d) in docs.entries()) {
      if (d.owner == owner) {
        let day = dayKey(d.uploadedAt);
        switch (byDay.get(day)) {
          case (?c) { byDay.add(day, c + 1) };
          case null { byDay.add(day, 1) };
        };
      };
    };
    let points = List.empty<Types.UploadTrendPoint>();
    for ((day, count) in byDay.entries()) {
      points.add({ period = day; count });
    };
    let arr = points.toArray();
    let sorted = arr.sort(func (a, b) = Text.compare(a.period, b.period));
    sorted;
  };

  public func getKnowledgeGraph(docs : Map.Map<Nat, Types.Document>, owner : Principal) : Types.KnowledgeGraph {
    let nodes = List.empty<Types.GraphNode>();
    let edges = List.empty<Types.GraphEdge>();
    let categories = [#education, #identity, #finance, #insurance, #projects, #achievements];
    for (cat in categories.values()) {
      let catLabel = categoryToText(cat);
      nodes.add({ id = "cat:" # catLabel; name = catLabel; kind = "category" });
    };
    for ((_, d) in docs.entries()) {
      if (d.owner == owner) {
        let docId = "doc:" # d.id.toText();
        nodes.add({ id = docId; name = d.name; kind = "document" });
        edges.add({ source = docId; target = "cat:" # categoryToText(d.category); relation = "classified_as" });
        for (m in d.metadata.values()) {
          let entityId = "entity:" # m;
          nodes.add({ id = entityId; name = m; kind = "entity" });
          edges.add({ source = docId; target = entityId; relation = "mentions" });
        };
      };
    };
    { nodes = nodes.toArray(); edges = edges.toArray() };
  };

  func toView(d : Types.Document, viewer : Principal, verified : Bool) : Types.DocumentView {
    let hasPassword = d.passwordHash != null;
    if (viewer == d.owner or not hasPassword or verified) {
      {
        id = d.id;
        owner = d.owner;
        name = ?d.name;
        fileType = ?d.fileType;
        uploadedAt = d.uploadedAt;
        category = ?d.category;
        metadata = d.metadata;
        summary = d.summary;
        blob = ?d.blob;
        locked = false;
        hasPassword;
      };
    } else {
      {
        id = d.id;
        owner = d.owner;
        name = null;
        fileType = null;
        uploadedAt = d.uploadedAt;
        category = null;
        metadata = [];
        summary = null;
        blob = null;
        locked = true;
        hasPassword = true;
      };
    };
  };

  func matches(d : Types.Document, q : Text) : Bool {
    let nameMatch = d.name.toLower().contains(#text q);
    let categoryMatch = categoryToText(d.category).toLower().contains(#text q);
    var metaMatch = false;
    for (m in d.metadata.values()) {
      if (m.toLower().contains(#text q)) { metaMatch := true };
    };
    nameMatch or categoryMatch or metaMatch;
  };

  func containsAny(text : Text, terms : [Text]) : Bool {
    var found = false;
    for (term in terms.values()) {
      if (text.contains(#text term)) { found := true };
    };
    found;
  };

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

  func dayKey(t : Int) : Text {
    let days = t / 86400000000000;
    days.toText();
  };
};
