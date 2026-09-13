import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type DocumentCategory = {
    #education;
    #identity;
    #finance;
    #insurance;
    #projects;
    #achievements;
  };

  public type Document = {
    id : Nat;
    owner : Principal;
    name : Text;
    fileType : Text;
    uploadedAt : Int;
    blob : Storage.ExternalBlob;
    category : DocumentCategory;
    metadata : [Text];
    summary : ?Text;
    passwordSalt : ?Blob;
    passwordHash : ?Blob;
  };

  public type PasswordError = {
    #notFound;
    #notOwner;
    #alreadySet;
    #noPassword;
  };

  public type DocumentView = {
    id : Nat;
    owner : Principal;
    name : ?Text;
    fileType : ?Text;
    uploadedAt : Int;
    category : ?DocumentCategory;
    metadata : [Text];
    summary : ?Text;
    blob : ?Storage.ExternalBlob;
    locked : Bool;
    hasPassword : Bool;
  };

  public type CategoryCount = {
    category : DocumentCategory;
    count : Nat;
  };

  public type UploadTrendPoint = {
    period : Text;
    count : Nat;
  };

  public type AnalyticsOverview = {
    totalDocuments : Nat;
    byCategory : [CategoryCount];
  };

  public type GraphNode = {
    id : Text;
    name : Text;
    kind : Text;
  };

  public type GraphEdge = {
    source : Text;
    target : Text;
    relation : Text;
  };

  public type KnowledgeGraph = {
    nodes : [GraphNode];
    edges : [GraphEdge];
  };

  public type DocumentsState = {
    var nextId : Nat;
  };
};
