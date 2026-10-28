-- Esquema de WopFit para MySQL 8 (REGLAS 4). Lo genera Hibernate a partir de las entidades; no se edita a mano.
-- Se usa para la entrega: crear la base con este archivo y correr el backend con el perfil "prod" (ddl-auto=validate).
--   mysql -u wopfit -p wopfit < backend/db/schema.sql
-- Si cambia una entidad, hay que volver a generarlo (ver README, "Esquema de la base").

    create table community_profiles (
        days_per_week integer not null,
        demo bit not null,
        id bigint not null auto_increment,
        user_id bigint,
        name varchar(40) not null,
        goals varchar(80),
        primary key (id)
    ) engine=InnoDB;

    create table consultations (
        booked_on date not null,
        consult_date date not null,
        consult_time varchar(5) not null,
        id bigint not null auto_increment,
        professional_id bigint not null,
        user_id bigint not null,
        mode varchar(15) not null,
        primary key (id)
    ) engine=InnoDB;

    create table follows (
        followed_id bigint not null,
        follower_id bigint not null,
        id bigint not null auto_increment,
        primary key (id)
    ) engine=InnoDB;

    create table goal_checks (
        check_date date,
        goal_id bigint not null
    ) engine=InnoDB;

    create table goals (
        done bit not null,
        done_at date,
        start_date date not null,
        times_per_week integer not null,
        weeks integer not null,
        id bigint not null auto_increment,
        user_id bigint not null,
        objective varchar(20) not null,
        what varchar(120) not null,
        primary key (id)
    ) engine=InnoDB;

    create table habit_logs (
        habit_date date not null,
        sleep bit not null,
        walk bit not null,
        water bit not null,
        id bigint not null auto_increment,
        user_id bigint not null,
        primary key (id)
    ) engine=InnoDB;

    create table meal_logs (
        meal_date date not null,
        slot integer not null,
        swaps integer not null,
        id bigint not null auto_increment,
        user_id bigint not null,
        reason varchar(20),
        alternative_name varchar(120),
        status enum ('ALTERNATIVE','EATEN','SKIPPED'),
        primary key (id)
    ) engine=InnoDB;

    create table offers (
        days integer not null,
        start_date date not null,
        id bigint not null auto_increment,
        category varchar(10) not null,
        discount_value varchar(10) not null,
        brand varchar(20),
        code varchar(20) not null,
        unit varchar(20),
        store varchar(60) not null,
        description varchar(120) not null,
        ingredients varchar(200),
        primary key (id)
    ) engine=InnoDB;

    create table photos (
        created_at datetime(6) not null,
        owner_id bigint not null,
        content_type varchar(20) not null,
        id varchar(36) not null,
        data mediumblob not null,
        primary key (id)
    ) engine=InnoDB;

    create table places (
        discount bit not null,
        lat float(53) not null,
        lng float(53) not null,
        closes varchar(5),
        opens varchar(5),
        id bigint not null auto_increment,
        category varchar(10) not null,
        brand varchar(20),
        barrio varchar(40),
        name varchar(80) not null,
        address varchar(120) not null,
        primary key (id)
    ) engine=InnoDB;

    create table plan_days (
        day_of_week integer,
        owner_id bigint not null
    ) engine=InnoDB;

    create table plans (
        adjust_seen_week date,
        generated_until date not null,
        lighten_seen_week date,
        minutes_per_session integer,
        start_date date not null,
        id bigint not null auto_increment,
        updated_at datetime(6),
        user_id bigint not null,
        level varchar(20),
        primary key (id)
    ) engine=InnoDB;

    create table post_comments (
        author_id bigint not null,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        post_id bigint not null,
        text varchar(300) not null,
        primary key (id)
    ) engine=InnoDB;

    create table post_marks (
        kind varchar(5) not null,
        id bigint not null auto_increment,
        post_id bigint not null,
        profile_id bigint not null,
        primary key (id)
    ) engine=InnoDB;

    create table posts (
        base_likes integer not null,
        author_id bigint not null,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        bg varchar(9),
        goal varchar(10) not null,
        type varchar(10) not null,
        emoji varchar(16),
        photo_id varchar(36),
        title varchar(100) not null,
        tags varchar(120),
        body varchar(1000),
        primary key (id)
    ) engine=InnoDB;

    create table preference_activities (
        owner_id bigint not null,
        activity varchar(255)
    ) engine=InnoDB;

    create table preference_avoid (
        owner_id bigint not null,
        food varchar(255)
    ) engine=InnoDB;

    create table preference_days (
        day_of_week integer,
        owner_id bigint not null
    ) engine=InnoDB;

    create table preference_equipment (
        owner_id bigint not null,
        item varchar(255)
    ) engine=InnoDB;

    create table preference_goals (
        owner_id bigint not null,
        goal varchar(255)
    ) engine=InnoDB;

    create table preference_health (
        owner_id bigint not null,
        condition_code varchar(255)
    ) engine=InnoDB;

    create table preference_pending (
        owner_id bigint not null,
        label varchar(255)
    ) engine=InnoDB;

    create table preferences (
        minutes_per_session integer,
        id bigint not null auto_increment,
        user_id bigint not null,
        budget varchar(10),
        level varchar(20),
        other_avoid varchar(80),
        primary key (id)
    ) engine=InnoDB;

    create table professionals (
        rating float(53) not null,
        id bigint not null auto_increment,
        kind varchar(10) not null,
        experience varchar(20),
        license varchar(40),
        name varchar(80) not null,
        specialty varchar(120) not null,
        bio varchar(300),
        primary key (id)
    ) engine=InnoDB;

    create table shopping_checks (
        week_start date not null,
        id bigint not null auto_increment,
        user_id bigint not null,
        item varchar(80) not null,
        primary key (id)
    ) engine=InnoDB;

    create table subscriptions (
        start_date date not null,
        valid_until date not null,
        id bigint not null auto_increment,
        user_id bigint not null,
        period varchar(12) not null,
        primary key (id)
    ) engine=InnoDB;

    create table users (
        birth_date date,
        height_cm integer,
        verified bit not null,
        weight_kg float(53),
        verification_code varchar(6),
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        name varchar(80),
        email varchar(160) not null,
        password_hash varchar(255) not null,
        role enum ('ADMIN','USER'),
        primary key (id)
    ) engine=InnoDB;

    create table wopi_messages (
        role varchar(4) not null,
        month_key varchar(7) not null,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        user_id bigint not null,
        context varchar(60),
        text varchar(1000) not null,
        extra varchar(4000),
        primary key (id)
    ) engine=InnoDB;

    create table workout_sessions (
        alternative_done bit not null,
        feel integer,
        moved_from date,
        moved_to date,
        session_date date not null,
        template integer not null,
        id bigint not null auto_increment,
        user_id bigint not null,
        alternative varchar(20),
        reason varchar(20),
        note varchar(300),
        reason_note varchar(300),
        status enum ('DONE','MOVED','PENDING','SKIPPED') not null,
        primary key (id)
    ) engine=InnoDB;

    alter table community_profiles
       add constraint uk_community_profile_user unique (user_id);

    alter table consultations
       add constraint uk_consultation_slot unique (professional_id, consult_date, consult_time);

    alter table follows
       add constraint uk_follow_pair unique (follower_id, followed_id);

    alter table habit_logs
       add constraint uk_habit_log_day unique (user_id, habit_date);

    alter table meal_logs
       add constraint uk_meal_log_slot unique (user_id, meal_date, slot);

    alter table offers
       add constraint uk_offer_code unique (code);

    alter table plans
       add constraint uk_plan_user unique (user_id);

    alter table post_marks
       add constraint uk_post_mark unique (post_id, profile_id, kind);

    alter table preferences
       add constraint uk_preferences_user unique (user_id);

    alter table shopping_checks
       add constraint uk_shopping_check_item unique (user_id, week_start, item);

    alter table subscriptions
       add constraint uk_subscription_user unique (user_id);

    alter table users
       add constraint uk_user_email unique (email);

    create index idx_wopi_message_month
       on wopi_messages (user_id, month_key);

    alter table community_profiles
       add constraint fk_community_profile_user
       foreign key (user_id)
       references users (id);

    alter table consultations
       add constraint fk_consultation_professional
       foreign key (professional_id)
       references professionals (id);

    alter table consultations
       add constraint fk_consultation_user
       foreign key (user_id)
       references users (id);

    alter table follows
       add constraint fk_follow_followed
       foreign key (followed_id)
       references community_profiles (id);

    alter table follows
       add constraint fk_follow_follower
       foreign key (follower_id)
       references community_profiles (id);

    alter table goal_checks
       add constraint fk_goal_check_goal
       foreign key (goal_id)
       references goals (id);

    alter table goals
       add constraint fk_goal_user
       foreign key (user_id)
       references users (id);

    alter table habit_logs
       add constraint fk_habit_log_user
       foreign key (user_id)
       references users (id);

    alter table meal_logs
       add constraint fk_meal_log_user
       foreign key (user_id)
       references users (id);

    alter table photos
       add constraint fk_photo_owner
       foreign key (owner_id)
       references community_profiles (id);

    alter table plan_days
       add constraint fk_plan_day_plan
       foreign key (owner_id)
       references plans (id);

    alter table plans
       add constraint fk_plan_user
       foreign key (user_id)
       references users (id);

    alter table post_comments
       add constraint fk_post_comment_author
       foreign key (author_id)
       references community_profiles (id);

    alter table post_comments
       add constraint fk_post_comment_post
       foreign key (post_id)
       references posts (id);

    alter table post_marks
       add constraint fk_post_mark_post
       foreign key (post_id)
       references posts (id);

    alter table post_marks
       add constraint fk_post_mark_profile
       foreign key (profile_id)
       references community_profiles (id);

    alter table posts
       add constraint fk_post_author
       foreign key (author_id)
       references community_profiles (id);

    alter table preference_activities
       add constraint fk_preference_activity_preferences
       foreign key (owner_id)
       references preferences (id);

    alter table preference_avoid
       add constraint fk_preference_avoid_preferences
       foreign key (owner_id)
       references preferences (id);

    alter table preference_days
       add constraint fk_preference_day_preferences
       foreign key (owner_id)
       references preferences (id);

    alter table preference_equipment
       add constraint fk_preference_equipment_preferences
       foreign key (owner_id)
       references preferences (id);

    alter table preference_goals
       add constraint fk_preference_goal_preferences
       foreign key (owner_id)
       references preferences (id);

    alter table preference_health
       add constraint fk_preference_health_preferences
       foreign key (owner_id)
       references preferences (id);

    alter table preference_pending
       add constraint fk_preference_pending_preferences
       foreign key (owner_id)
       references preferences (id);

    alter table preferences
       add constraint fk_preferences_user
       foreign key (user_id)
       references users (id);

    alter table shopping_checks
       add constraint fk_shopping_check_user
       foreign key (user_id)
       references users (id);

    alter table subscriptions
       add constraint fk_subscription_user
       foreign key (user_id)
       references users (id);

    alter table wopi_messages
       add constraint fk_wopi_message_user
       foreign key (user_id)
       references users (id);

    alter table workout_sessions
       add constraint fk_workout_session_user
       foreign key (user_id)
       references users (id);
