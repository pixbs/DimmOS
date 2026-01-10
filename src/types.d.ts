interface ActorProps {
  type:
    | {
        title: string;
        icon: string;
        actorType: "shortcut";
      }
    | {
        title: string;
        actorType: "window";
      }
    | {
        actorType: "dimm";
      };
}
