# VLAD

## What is VLAD?

VLAD, also known as the VEX Logging and Assignment Dashboard is a tool created by members of VURC team SKERS. It is a website used to assign and track tasks relative to the different levels of VEX Robotics Competitions.

## Layout

VLAD is separated into four levels:

1. `Team` contains `Subteams`
2. `Subteams` contain `Projects`
3. `Projects` contain `Tasks`
4. `Tasks` are the lowest level

`Teams` can have any number of users, but only one admin user. By default, the admin user is the user that created the team, but this can be changed later. Teams also require a name. Names can include characters and numbers. Teams can have any number of subteams.

`Subteams` can belong to only one team. Users can belong to multiple subteams. Users can optionally be notified via email about changes within a subteam. Subteam names can include characters and numbers. Subteams can optionally have a 'lead' user. This user acts as admin of the subteam, but not of the team as a whole.

`Projects` can belong to only one Subteam. Users <u>cannot</u> be assigned to Projects, with the exception of a lead. Lead users can edit the details of the Project, as can the lead of the Subteam the Project belongs to and the Team admin. Projects can optionally have duedates and descriptions.

`Tasks` can belong to only one Project. Any user on the Subteam can create Tasks and assign themselves to it. only leads and admin can edit Tasks after creation and assign _other_ users to them.

We do recommend certain ways of formatting your team depending on grade level (VURC vs V5RC), but they are merely recommendations and are in no way enforced.

### Example VURC Layout

- SKERS (Team)
    - Software (Subteam)
        - Library (Project)
        - Competition Autonomous (Project)
            - Skills (Task)
            - Match (Task)
    - Hardware (Subteam)
        - 24" Robot (Project)
        - 15" Robot (Project)
    - Electronics (Subteam)
        - Raspi (Project)
            - Comm Library (Task)

### Example V5RC Layout

- Robotics Club (Team)
    - 00000A (Subteam)
        - Second Robot (Project)
            - Match Autonomous (Task)
            - Skills Autonomous (Task)
    - 00000B
        - Third Robot (Project)
            - ...
    - ...
