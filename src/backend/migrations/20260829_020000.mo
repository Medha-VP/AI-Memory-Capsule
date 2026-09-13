import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type DocumentCategory = {
    #education;
    #identity;
    #finance;
    #insurance;
    #projects;
    #achievements;
  };

  type OldDocument = {
    id : Nat;
    owner : Principal;
    name : Text;
    fileType : Text;
    uploadedAt : Int;
    blob : Blob;
    category : DocumentCategory;
    metadata : [Text];
    summary : ?Text;
  };

  type NewDocument = {
    id : Nat;
    owner : Principal;
    name : Text;
    fileType : Text;
    uploadedAt : Int;
    blob : Blob;
    category : DocumentCategory;
    metadata : [Text];
    summary : ?Text;
    passwordSalt : ?Blob;
    passwordHash : ?Blob;
  };

  type DocumentsState = {
    var nextId : Nat;
  };

  type OldActor = {
    var accessControlState : AccessControlState;
    docs : Map.Map<Nat, OldDocument>;
    state : DocumentsState;
  };

  type NewActor = {
    var accessControlState : AccessControlState;
    docs : Map.Map<Nat, NewDocument>;
    state : DocumentsState;
  };

  public func migration(old : OldActor) : NewActor {
    {
      var accessControlState = old.accessControlState;
      docs = old.docs.map(
        func(_, d) {
          { d with passwordSalt = null; passwordHash = null };
        }
      );
      state = old.state;
    };
  };
};
