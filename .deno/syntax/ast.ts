// import { IType } from '../../interfaces';
import { nil } from '../utils.ts';

export const LOCATION = Symbol('_location_');

export function locationOf(node: PGNode): StatementLocation {
    const n = node[LOCATION];
    if (!n) {
        throw new Error('This statement has not been parsed using location tracking (which has a small performance hit). ')
    }
    return n;
}

export type Statement = SelectStatement
    | CreateTableStatement
    | CreateSequenceStatement
    | CreateIndexStatement
    | CreateExtensionStatement
    | CommitStatement
    | InsertStatement
    | UpdateStatement
    | ShowStatement
    | PrepareStatement
    | DeleteStatement
    | WithStatement
    | RollbackStatement
    | TablespaceStatement
    | CreateViewStatement
    | CreateMaterializedViewStatement
    | AlterTableStatement
    | AlterSequenceStatement
    | SetGlobalStatement
    | SetTimezone
    | CreateEnumType
    | TruncateTableStatement
    | DropTableStatement
    | DropSequenceStatement
    | DropIndexStatement
    | CommentStatement
    | CreateSchemaStatement
    | RaiseStatement
    | CreateFunctionStatement
    | DoStatement
    | StartTransactionStatement;

export interface PGNode {
    [LOCATION]?: StatementLocation;
}

export interface PGComment extends PGNode {
    comment: string;
}

export interface DoStatement extends PGNode {
    type: 'do';
    language?: string;
    code: string;
}

export interface CreateFunctionStatement extends QName, PGNode {
    type: 'create function';
    code: string;
    orReplace?: boolean;
    language?: string;
    arguments: FunctionArgument[];
    returns?: DataTypeDef | ReturnsTable;
    purity?: 'immutable' | 'stable' | 'volatile';
    leakproof?: boolean;
    onNullInput?: 'call' | 'null' | 'strict';
}

export interface ReturnsTable {
    kind: 'table';
    columns: { name: string; type: DataTypeDef }[];
}

export type FunctionArgumentMode = 'in' | 'out' | 'inout' | 'variadic';

export interface FunctionArgument {
    name?: string;
    type: DataTypeDef;
    default?: Expr;
    mode?: FunctionArgumentMode;
}

export interface CommentStatement extends PGNode {
    type: 'comment';
    comment: string;
    /** This is not exhaustive compared to https://www.postgresql.org/docs/13/sql-comment.html
     * But this is what's supported. File an issue if you want more.
     */
    on: {
        type: 'table' | 'database' | 'index' | 'materialized view' | 'trigger' | 'type' | 'view';
        name: QName;
    } | {
        type: 'column';
        column: QColumn;
    };
}

export interface RaiseStatement extends PGNode {
    type: 'raise';
    level?: 'debug' | 'log' | 'info' | 'notice' | 'warning' | 'exception';
    format: string;
    formatExprs?: Expr[] | nil;
    using?: {
        type: 'message'
        | 'detail'
        | 'hint'
        | 'errcode'
        | 'column'
        | 'constraint'
        | 'datatype'
        | 'table'
        | 'schema';
        value: Expr;
    }[] | nil;
}

export interface CreateSchemaStatement extends PGNode {
    type: 'create schema';
    name: string;
    ifNotExists?: boolean;
}

export interface PrepareStatement extends PGNode {
    type: 'prepare';
    name: string;
    args?: DataTypeDef[] | nil;
    statement: Statement;
}

export interface CreateEnumType extends PGNode {
    type: 'create enum',
    name: QName;
    values: string[];
}


export interface ShowStatement extends PGNode {
    type: 'show';
    variable: string;
}

export interface TruncateTableStatement extends PGNode {
    type: 'truncate table';
    tables: QName[];
}
export interface DropTableStatement extends QName, PGNode {
    type: 'drop table';
    ifExists?: boolean;
}

export interface DropSequenceStatement extends QName, PGNode {
    type: 'drop sequence';
    ifExists?: boolean;
}

export interface DropIndexStatement extends QName, PGNode {
    type: 'drop index';
    ifExists?: boolean;
    concurrently?: boolean;
}

export interface StatementLocation {
    /** Location of the last ";" prior to this statement */
    start: number;
    /** Location of the first ";" after this statement (if any) */
    end: number;
}

export interface StartTransactionStatement extends PGNode {
    type: 'start transaction';
}
export interface CommitStatement extends PGNode {
    type: 'commit';
}
export interface RollbackStatement extends PGNode {
    type: 'rollback';
}

export interface TablespaceStatement extends PGNode {
    type: 'tablespace';
    tablespace: string;
}


export interface DeleteStatement extends PGNode {
    type: 'delete';
    from: QNameAliased;
    returning?: SelectedColumn[] | nil;
    where?: Expr | nil;
}

export interface InsertStatement extends PGNode {
    type: 'insert';
    into: QNameAliased;
    returning?: SelectedColumn[] | nil;
    columns?: string[] | nil;
    overriding?: 'system' | 'user';
    /** Insert values */
    values?: (Expr | 'default')[][] | nil;
    /** Insert into select */
    select?: SelectStatement | nil;
    onConflict?: OnConflictAction | nil;
}

export interface OnConflictAction {
    on?: Expr[] | nil;
    do: 'do nothing' | {
        sets: SetStatement[];
    };
}

export interface AlterTableStatement extends PGNode {
    type: 'alter table';
    table: QNameAliased;
    only?: boolean;
    ifExists?: boolean;
    change: TableAlteration;
}

export interface TableAlterationRename extends PGNode {
    type: 'rename';
    to: string;
}

export interface TableAlterationRenameColumn extends PGNode {
    type: 'rename column';
    column: string;
    to: string;
}
export interface TableAlterationRenameConstraint extends PGNode {
    type: 'rename constraint';
    constraint: string;
    to: string;
}
export interface TableAlterationAddColumn extends PGNode {
    type: 'add column';
    ifNotExists?: boolean;
    column: CreateColumnDef;
}

export interface TableAlterationDropColumn extends PGNode {
    type: 'drop column';
    ifExists?: boolean;
    column: string;
}

export interface TableAlterationAlterColumn extends PGNode {
    type: 'alter column',
    column: string;
    alter: AlterColumn
}

export interface TableAlterationAddConstraint extends PGNode {
    type: 'add constraint',
    constraint: TableConstraint;
}

export type TableAlteration = TableAlterationRename
    | TableAlterationRenameColumn
    | TableAlterationRenameConstraint
    | TableAlterationAddColumn
    | TableAlterationDropColumn
    | TableAlterationAlterColumn
    | TableAlterationAddConstraint
    | TableAlterationOwner


export interface TableAlterationOwner extends PGNode {
    type: 'owner';
    to: string;
}

export interface AlterColumnSetType extends PGNode {
    type: 'set type';
    dataType: DataTypeDef;
}

export interface AlterColumnSetDefault extends PGNode {
    type: 'set default';
    default: Expr;
    updateExisting?: boolean;
}

export interface AlterColumnAddGenerated extends PGNode {
    type: 'add generated',
    always?: 'always' | 'by default';
    constraintName?: string;
    sequence?: {
        name?: QName;
    } & CreateSequenceOptions;
}

export interface AlterColumnSimple extends PGNode {
    type: 'drop default' | 'set not null' | 'drop not null';
};

export type AlterColumn = AlterColumnSetType
    | AlterColumnSetDefault
    | AlterColumnAddGenerated
    | AlterColumnSimple;


/**
 * FROM https://www.postgresql.org/docs/12/ddl-constraints.html
 *
 * Restricting and cascading deletes are the two most common options.
 * RESTRICT prevents deletion of a referenced row.
 * NO ACTION means that if any referencing rows still exist when the constraint is checked,
 * an error is raised; this is the default behavior if you do not specify anything.
 * (The essential difference between these two choices is that NO ACTION allows the check to be deferred until later in the transaction, whereas RESTRICT does not.)
 * CASCADE specifies that when a referenced row is deleted,
 * row(s) referencing it should be automatically deleted as well.
 * There are two other options: SET NULL and SET DEFAULT.
 * These cause the referencing column(s) in the referencing row(s) to be set to nulls or their default values, respectively, when the referenced row is deleted.
 * Note that these do not excuse you from observing any constraints.
 * For example, if an action specifies SET DEFAULT but the default value would not satisfy the foreign key constraint, the operation will fail.
 */
export type ConstraintAction = 'cascade'
    | 'no action'
    | 'restrict'
    | 'set null'
    | 'set default';

export interface CreateIndexStatement extends PGNode {
    type: 'create index';
    table: QName;
    using?: string;
    expressions: IndexExpression[];
    unique?: true;
    ifNotExists?: true;
    indexName?: string;
}

export interface CreateExtensionStatement extends PGNode {
    type: 'create extension';
    extension: string;
    ifNotExists?: true;
    schema?: string;
    version?: string;
    from?: string;
}

export interface IndexExpression {
    expression: Expr;
    opclass?: QName;
    collate?: QName;
    order?: 'asc' | 'desc';
    nulls?: 'first' | 'last';
}


export interface CreateViewStatementBase extends QName, PGNode {
    columnNames?: string[];
    query: SelectStatement;
    parameters?: { [name: string]: string };
}
export interface CreateViewStatement extends CreateViewStatementBase {
    type: 'create view';
    orReplace?: boolean;
    recursive?: boolean;
    temp?: boolean;
    checkOption?: 'local' | 'cascaded';
}

export interface CreateMaterializedViewStatement extends CreateViewStatementBase {
    type: 'create materialized view';
    tablespace?: string;
    withData?: boolean;
    ifNotExists?: boolean;
}


export interface CreateTableStatement extends QName, PGNode {
    type: 'create table';
    ifNotExists?: true;
    columns: (CreateColumnDef | CreateColumnsLikeTable)[];
    /** Constraints not defined inline */
    constraints?: TableConstraint[];
    inherits?: QName[];
}

export interface CreateColumnsLikeTable {
    kind: 'like table';
    like: QName;
    options: CreateColumnsLikeTableOpt[];
}

export interface CreateColumnsLikeTableOpt {
    verb: 'including' | 'excluding';
    option: 'defaults' | 'constraints' | 'indexes' | 'storage' | 'comments' | 'all';
}

export interface CreateColumnDef extends PGNode {
    kind: 'column';
    name: string;
    dataType: DataTypeDef;
    constraints?: ColumnConstraint[];
    collate?: QName;
}


export interface QName extends PGNode {
    name: string;
    schema?: string;
}

export interface QColumn {
    table: string;
    column: string;
    schema?: string;
}

export type DataTypeDef = ArrayDataTypeDef | BasicDataTypeDef;

export interface ArrayDataTypeDef {
    kind: 'array';
    arrayOf: DataTypeDef;
}

export interface BasicDataTypeDef extends QName {
    kind?: undefined;
    /** varchar(length), numeric(precision, scale), ... */
    config?: number[];
}

export type ColumnConstraint
    = ColumnConstraintSimple
    | ColumnConstraintDefault
    | AlterColumnAddGenerated
    | ColumnConstraintCheck;

export interface ColumnConstraintSimple extends PGNode {
    type: 'unique'
    | 'primary key'
    | 'not null'
    | 'null';
    constraintName?: string;
}

export interface ColumnConstraintDefault extends PGNode {
    type: 'default';
    default: Expr;
    constraintName?: string;
}

export interface ColumnConstraintForeignKey {
    type: 'foreign key';
    constraintName?: string;
    foreignTable: QName;
    foreignColumns: string[];
    onDelete?: ConstraintAction;
    onUpdate?: ConstraintAction;
    match?: 'full' | 'partial' | 'simple';
}



// todo: add EXECLUDE
export type TableConstraint
    = TableConstraintUnique
    | TableConstraintForeignKey
    | TableConstraintCheck;

export type TableConstraintCheck = ColumnConstraintCheck;
export interface TableConstraintUnique {
    type: 'primary key' | 'unique';
    constraintName?: string;
    columns: string[];
}

export interface TableConstraintForeignKey extends ColumnConstraintForeignKey {
    localColumns: string[];
}

export interface ColumnConstraintCheck extends PGNode {
    type: 'check';
    constraintName?: string;
    expr: Expr;
}

export type WithStatementBinding = SelectStatement | InsertStatement | UpdateStatement | DeleteStatement;
export interface WithStatement extends PGNode {
    type: 'with';
    bind: {
        alias: string;
        statement: WithStatementBinding;
    }[];
    in: WithStatementBinding;
}

export type SelectStatement = SelectFromStatement
    | SelectFromUnion
    | WithStatement;

export interface SelectFromStatement extends PGNode {
    type: 'select',
    columns?: SelectedColumn[] | nil;
    from?: From[] | nil;
    where?: Expr | nil;
    groupBy?: Expr[] | nil;
    limit?: LimitStatement | nil;
    orderBy?: OrderByStatement[] | nil;
    distinct?: 'all' | 'distinct' | Expr[] | nil;
}

export interface SelectFromUnion extends PGNode {
    type: 'union',
    left: SelectStatement;
    right: SelectStatement;
}

export interface OrderByStatement {
    by: Expr;
    order: 'ASC' | 'DESC';
}

export interface LimitStatement {
    limit?: number;
    offset?: number;
}


export interface UpdateStatement extends PGNode {
    type: 'update';
    table: QNameAliased;
    sets: SetStatement[];
    where?: Expr | nil;
    returning?: SelectedColumn[] | nil;
}

export interface SetStatement {
    column: string;
    value: Expr | 'default';
}

export interface SelectedColumn extends PGNode {
    expr: Expr;
    alias?: string;
}

export type From = FromTable | FromStatement | FromValues | FromCall


export interface FromCall extends ExprCall {
    alias?: string;
    join?: JoinClause | nil;
};



export interface FromValues {
    type: 'values';
    alias: string;
    values: Expr[][];
    columnNames?: string[] | nil;
    join?: JoinClause | nil;
}


export interface QNameAliased extends QName {
    alias?: string;
}

export interface FromTable extends QNameAliased {
    type: 'table',
    join?: JoinClause | nil;
}

export interface FromStatement {
    type: 'statement';
    statement: SelectStatement;
    alias: string;
    db?: null | nil;
    join?: JoinClause | nil;
}

export interface JoinClause {
    type: JoinType;
    on?: Expr | nil;
}

export type JoinType = 'INNER JOIN'
    | 'LEFT JOIN'
    | 'RIGHT JOIN'
    | 'FULL JOIN';

export type Expr = ExprRef
    | ExprParameter
    | ExprList
    | ExprNull
    | ExprExtract
    | ExprInteger
    | ExprMember
    | ExprValueKeyword
    | ExprArrayIndex
    | ExprNumeric
    | ExprString
    | ExprCase
    | ExprBinary
    | ExprUnary
    | ExprCast
    | ExprBool
    | ExprCall
    | SelectStatement
    | WithStatement
    | ExprConstant
    | ExprTernary
    | ExprOverlay
    | ExprSubstring;


/**
 * Handle special syntax: overlay('12345678' placing 'ab' from 2 for 4)
 */
export interface ExprOverlay extends PGNode {
    type: 'overlay';
    value: Expr;
    placing: Expr;
    from: Expr;
    for?: Expr | nil;
}


/** Handle special syntax: substring('val' from 2 for 3) */
export interface ExprSubstring extends PGNode {
    type: 'substring';
    value: Expr;
    from?: Expr | nil;
    for?: Expr | nil;
}

export type LogicOperator = 'OR' | 'AND';
export type EqualityOperator = 'IN' | 'NOT IN' | 'LIKE' | 'NOT LIKE' | 'ILIKE' | 'NOT ILIKE' | '=' | '!=';
export type ComparisonOperator = '>' | '>=' | '<' | '<=' | '@>' | '<@' | '?' | '?|' | '?&' | '#>>';
export type AdditiveOperator = '||' | '-' | '#-' | '&&' | '+';
export type MultiplicativeOperator = '*' | '%' | '/';
export type BinaryOperator = LogicOperator
    | EqualityOperator
    | ComparisonOperator
    | AdditiveOperator
    | MultiplicativeOperator
    | '^'

export interface ExprBinary extends PGNode {
    type: 'binary';
    left: Expr;
    right: Expr;
    op: BinaryOperator;
}

export interface ExprConstant extends PGNode {
    type: 'constant';
    dataType: DataTypeDef, // | IType;
    value: any;
}

export type ExprLiteral = ExprConstant | ExprInteger | ExprNumeric | ExprString | ExprBool | ExprNull;


export interface ExprTernary extends PGNode {
    type: 'ternary';
    value: Expr;
    lo: Expr;
    hi: Expr;
    op: 'BETWEEN' | 'NOT BETWEEN';
}

export interface ExprCast extends PGNode {
    type: 'cast';
    to: DataTypeDef;
    operand: Expr;
}


export type UnaryOperator = '+' | '-' | 'NOT' | 'IS NULL' | 'IS NOT NULL' | 'IS TRUE' | 'IS FALSE' | 'IS NOT TRUE' | 'IS NOT FALSE';
export interface ExprUnary extends PGNode {
    type: 'unary';
    operand: Expr;
    op: UnaryOperator;
}

export interface ExprRef extends PGNode {
    type: 'ref';
    table?: string;
    name: string | '*';
}

export interface ExprParameter extends PGNode {
    type: 'parameter';
    name: string;
}


export interface ExprMember extends PGNode {
    type: 'member';
    operand: Expr;
    op: '->' | '->>';
    member: string | number;
}

export interface ExprValueKeyword extends PGNode {
    type: 'keyword',
    keyword: ValueKeyword;
}

export type ValueKeyword = 'current_catalog'
    | 'current_date'
    | 'current_role'
    | 'current_schema'
    | 'current_timestamp'
    | 'current_time'
    | 'localtimestamp'
    | 'localtime'
    | 'session_user'
    | 'user'
    | 'current_user'
    | 'distinct';

export interface ExprCall extends PGNode {
    type: 'call';
    /** Function name */
    function: string | ExprValueKeyword;
    /** Function namespace (ex: pg_catalog) */
    namespace?: string;
    args: Expr[];
}


export interface ExprExtract extends PGNode {
    type: 'extract';
    field: string;
    from: Expr;
}

export interface ExprList extends PGNode {
    type: 'list' | 'array';
    expressions: Expr[];
}

export interface ExprArrayIndex extends PGNode {
    type: 'arrayIndex',
    array: Expr;
    index: Expr;
}

export interface ExprNull extends PGNode {
    type: 'null';
}

export interface ExprInteger extends PGNode {
    type: 'integer';
    value: number;
}

export interface ExprNumeric extends PGNode {
    type: 'numeric';
    value: number;
}

export interface ExprString extends PGNode {
    type: 'string';
    value: string;
}

export interface ExprBool extends PGNode {
    type: 'boolean';
    value: boolean;
}

export interface ExprCase extends PGNode {
    type: 'case';
    value?: Expr | nil;
    whens: ExprWhen[];
    else?: Expr | nil;
}

export interface ExprWhen extends PGNode {
    when: Expr;
    value: Expr;
}

export interface SetGlobalStatement extends PGNode {
    type: 'set';
    variable: string;
    set: SetGlobalValue;
}
export interface SetTimezone extends PGNode {
    type: 'set timezone',
    to: SetTimezoneValue;
}

export type SetTimezoneValue = {
    type: 'value';
    value: number | string;
} | {
    type: 'local' | 'default';
} | {
    type: 'interval';
    value: string;
};

type SetGlobalValueRaw = {
    type: 'value',
    value: number | string;
} | {
    type: 'identifier',
    name: string;
};
export type SetGlobalValue
    = SetGlobalValueRaw
    | { type: 'default' }
    | {
        type: 'list',
        values: SetGlobalValueRaw[],
    }

export interface CreateSequenceStatement extends QName, PGNode {
    type: 'create sequence';
    temp?: boolean;
    ifNotExists?: boolean;
    options: CreateSequenceOptions;
}

export interface CreateSequenceOptions extends PGNode {
    as?: DataTypeDef;
    incrementBy?: number;
    minValue?: 'no minvalue' | number;
    maxValue?: 'no maxvalue' | number;
    startWith?: number;
    cache?: number;
    cycle?: 'cycle' | 'no cycle';
    ownedBy?: 'none' | QColumn;
}



export interface AlterSequenceStatement extends QName, PGNode {
    type: 'alter sequence';
    ifExists?: boolean;
    change: AlterSequenceChange;
}

export type AlterSequenceChange
    = AlterSequenceSetOptions
    | AlterSequenceOwnerTo
    | AlterSequenceRename
    | AlterSequenceSetSchema;

export interface AlterSequenceSetOptions extends CreateSequenceOptions {
    type: 'set options';
    restart?: true | number;
}

export interface AlterSequenceOwnerTo {
    type: 'owner to';
    owner: 'session_user' | 'current_user' | { user: string };
}

export interface AlterSequenceRename {
    type: 'rename';
    newName: string;
}

export interface AlterSequenceSetSchema {
    type: 'set schema';
    newSchema: string;
}

export type GeometricLiteral
    = Point
    | Line
    | Segment
    | Box
    | Path
    | Polygon
    | Circle;


export interface Point {
    x: number;
    y: number;
}

/** Line  aX+bY+c */
export interface Line {
    a: number;
    b: number;
    c: number;
}

export type Segment = [Point, Point];
export type Box = [Point, Point];

export interface Path {
    closed: boolean;
    path: Point[];
}

export type Polygon = Point[];

export interface Circle {
    c: Point;
    r: number;
}

export interface Interval {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}
