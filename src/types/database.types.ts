export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      autorizacao_faturamento: {
        Row: {
          autorizado_em: string
          autorizado_por: string
          id: number
          projeto_id: number
        }
        Insert: {
          autorizado_em?: string
          autorizado_por: string
          id?: never
          projeto_id: number
        }
        Update: {
          autorizado_em?: string
          autorizado_por?: string
          id?: never
          projeto_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "autorizacao_faturamento_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacao_faturamento_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacao_faturamento_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: true
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacao_faturamento_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: true
            referencedRelation: "v_projetos_administrativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacao_faturamento_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: true
            referencedRelation: "v_projetos_operacional"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cnpj: string | null
          criado_em: string
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cnpj?: string | null
          criado_em?: string
          id?: never
          nome: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cnpj?: string | null
          criado_em?: string
          id?: never
          nome?: string
        }
        Relationships: []
      }
      evento_projeto: {
        Row: {
          detalhes: Json | null
          id: number
          motivo_cancelamento: string | null
          projeto_id: number
          realizado_em: string
          realizado_por: string
          status_anterior: Database["public"]["Enums"]["project_status"] | null
          status_novo: Database["public"]["Enums"]["project_status"] | null
          tipo: Database["public"]["Enums"]["project_event_type"]
        }
        Insert: {
          detalhes?: Json | null
          id?: never
          motivo_cancelamento?: string | null
          projeto_id: number
          realizado_em?: string
          realizado_por: string
          status_anterior?: Database["public"]["Enums"]["project_status"] | null
          status_novo?: Database["public"]["Enums"]["project_status"] | null
          tipo: Database["public"]["Enums"]["project_event_type"]
        }
        Update: {
          detalhes?: Json | null
          id?: never
          motivo_cancelamento?: string | null
          projeto_id?: number
          realizado_em?: string
          realizado_por?: string
          status_anterior?: Database["public"]["Enums"]["project_status"] | null
          status_novo?: Database["public"]["Enums"]["project_status"] | null
          tipo?: Database["public"]["Enums"]["project_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "evento_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_projetos_administrativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_projetos_operacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_projeto_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_projeto_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      nota_fiscal: {
        Row: {
          atualizado_em: string
          data_emissao: string
          id: number
          numero: string
          projeto_id: number
          registrado_em: string
          registrado_por: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          data_emissao: string
          id?: never
          numero: string
          projeto_id: number
          registrado_em?: string
          registrado_por: string
          valor: number
        }
        Update: {
          atualizado_em?: string
          data_emissao?: string
          id?: never
          numero?: string
          projeto_id?: number
          registrado_em?: string
          registrado_por?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "nota_fiscal_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: true
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: true
            referencedRelation: "v_projetos_administrativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: true
            referencedRelation: "v_projetos_operacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      operadora: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: never
          nome: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: never
          nome?: string
        }
        Relationships: []
      }
      ordem_compra: {
        Row: {
          atualizado_em: string
          centro_custo: string | null
          data_oc: string
          id: number
          numero: string
          registrado_em: string
          registrado_por: string
        }
        Insert: {
          atualizado_em?: string
          centro_custo?: string | null
          data_oc: string
          id?: never
          numero: string
          registrado_em?: string
          registrado_por: string
        }
        Update: {
          atualizado_em?: string
          centro_custo?: string | null
          data_oc?: string
          id?: never
          numero?: string
          registrado_em?: string
          registrado_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordem_compra_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordem_compra_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto: {
        Row: {
          ano: number
          atualizado_em: string
          cidade: string
          cliente_id: number
          codigo_pasta: string
          criado_em: string
          criado_por: string
          data_envio: string | null
          fundacao_compatibilizada: boolean
          fundacao_compatibilizada_em: string | null
          fundacao_compatibilizada_por: string | null
          id: number
          identificador_cliente: string
          identificador_operadora: string
          numero: number
          operadora_id: number
          ordem_compra_id: number | null
          projeto_anterior_id: number | null
          responsavel_interno_id: string
          status: Database["public"]["Enums"]["project_status"]
          tipo_projeto_id: number
          uf: string
        }
        Insert: {
          ano: number
          atualizado_em?: string
          cidade: string
          cliente_id: number
          codigo_pasta: string
          criado_em?: string
          criado_por: string
          data_envio?: string | null
          fundacao_compatibilizada?: boolean
          fundacao_compatibilizada_em?: string | null
          fundacao_compatibilizada_por?: string | null
          id?: never
          identificador_cliente: string
          identificador_operadora: string
          numero: number
          operadora_id: number
          ordem_compra_id?: number | null
          projeto_anterior_id?: number | null
          responsavel_interno_id: string
          status?: Database["public"]["Enums"]["project_status"]
          tipo_projeto_id: number
          uf: string
        }
        Update: {
          ano?: number
          atualizado_em?: string
          cidade?: string
          cliente_id?: number
          codigo_pasta?: string
          criado_em?: string
          criado_por?: string
          data_envio?: string | null
          fundacao_compatibilizada?: boolean
          fundacao_compatibilizada_em?: string | null
          fundacao_compatibilizada_por?: string | null
          id?: never
          identificador_cliente?: string
          identificador_operadora?: string
          numero?: number
          operadora_id?: number
          ordem_compra_id?: number | null
          projeto_anterior_id?: number | null
          responsavel_interno_id?: string
          status?: Database["public"]["Enums"]["project_status"]
          tipo_projeto_id?: number
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_fundacao_compatibilizada_por_fkey"
            columns: ["fundacao_compatibilizada_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_fundacao_compatibilizada_por_fkey"
            columns: ["fundacao_compatibilizada_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadora"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_ordem_compra_id_fkey"
            columns: ["ordem_compra_id"]
            isOneToOne: false
            referencedRelation: "ordem_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_ordem_compra_id_fkey"
            columns: ["ordem_compra_id"]
            isOneToOne: false
            referencedRelation: "v_ordens_compra_administrativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_projeto_anterior_id_fkey"
            columns: ["projeto_anterior_id"]
            isOneToOne: true
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_projeto_anterior_id_fkey"
            columns: ["projeto_anterior_id"]
            isOneToOne: true
            referencedRelation: "v_projetos_administrativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_projeto_anterior_id_fkey"
            columns: ["projeto_anterior_id"]
            isOneToOne: true
            referencedRelation: "v_projetos_operacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_responsavel_interno_id_fkey"
            columns: ["responsavel_interno_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_responsavel_interno_id_fkey"
            columns: ["responsavel_interno_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_tipo_projeto_id_fkey"
            columns: ["tipo_projeto_id"]
            isOneToOne: false
            referencedRelation: "tipo_projeto"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimento: {
        Row: {
          confirmado_em: string
          confirmado_por: string
          data_recebimento: string
          id: number
          nota_fiscal_id: number
          valor_recebido: number
        }
        Insert: {
          confirmado_em?: string
          confirmado_por: string
          data_recebimento: string
          id?: never
          nota_fiscal_id: number
          valor_recebido: number
        }
        Update: {
          confirmado_em?: string
          confirmado_por?: string
          data_recebimento?: string
          id?: never
          nota_fiscal_id?: number
          valor_recebido?: number
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_confirmado_por_fkey"
            columns: ["confirmado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_confirmado_por_fkey"
            columns: ["confirmado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "nota_fiscal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "v_projetos_administrativo"
            referencedColumns: ["nota_fiscal_id"]
          },
        ]
      }
      tipo_projeto: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          faixa: unknown
          faixa_final: number | null
          faixa_inicial: number
          id: number
          is_ppi: boolean
          limite_parcelas: number
          nome: string
          proximo_numero: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          faixa?: unknown
          faixa_final?: number | null
          faixa_inicial: number
          id?: never
          limite_parcelas?: number
          nome: string
          // Preenchido pelo trigger fn_proximo_automatico (nasce = faixa_inicial).
          proximo_numero?: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          faixa?: unknown
          faixa_final?: number | null
          faixa_inicial?: number
          id?: never
          limite_parcelas?: number
          nome?: string
          proximo_numero?: number
        }
        Relationships: []
      }
      usuario: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      v_dashboard_financeiro: {
        Row: {
          saldo_receber: number | null
          valor_faturado: number | null
          valor_recebido: number | null
        }
        Relationships: []
      }
      v_dashboard_operacional: {
        Row: {
          quantidade: number | null
          status: Database["public"]["Enums"]["project_status"] | null
        }
        Relationships: []
      }
      v_eventos_operacionais: {
        Row: {
          detalhes: Json | null
          id: number | null
          motivo_cancelamento: string | null
          projeto_id: number | null
          realizado_em: string | null
          realizado_por: string | null
          status_anterior: Database["public"]["Enums"]["project_status"] | null
          status_novo: Database["public"]["Enums"]["project_status"] | null
          tipo: Database["public"]["Enums"]["project_event_type"] | null
        }
        Insert: {
          detalhes?: Json | null
          id?: number | null
          motivo_cancelamento?: string | null
          projeto_id?: number | null
          realizado_em?: string | null
          realizado_por?: string | null
          status_anterior?: Database["public"]["Enums"]["project_status"] | null
          status_novo?: Database["public"]["Enums"]["project_status"] | null
          tipo?: Database["public"]["Enums"]["project_event_type"] | null
        }
        Update: {
          detalhes?: Json | null
          id?: number | null
          motivo_cancelamento?: string | null
          projeto_id?: number | null
          realizado_em?: string | null
          realizado_por?: string | null
          status_anterior?: Database["public"]["Enums"]["project_status"] | null
          status_novo?: Database["public"]["Enums"]["project_status"] | null
          tipo?: Database["public"]["Enums"]["project_event_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_projetos_administrativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_projetos_operacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_projeto_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_projeto_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ordens_compra_administrativo: {
        Row: {
          atualizado_em: string | null
          centro_custo: string | null
          data_oc: string | null
          id: number | null
          numero: string | null
          registrado_em: string | null
          registrado_por: string | null
        }
        Insert: {
          atualizado_em?: string | null
          centro_custo?: string | null
          data_oc?: string | null
          id?: number | null
          numero?: string | null
          registrado_em?: string | null
          registrado_por?: string | null
        }
        Update: {
          atualizado_em?: string | null
          centro_custo?: string | null
          data_oc?: string | null
          id?: number | null
          numero?: string | null
          registrado_em?: string | null
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordem_compra_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordem_compra_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      v_projetos_administrativo: {
        Row: {
          ano: number | null
          atualizado_em: string | null
          autorizado_em: string | null
          autorizado_por: string | null
          centro_custo: string | null
          cidade: string | null
          cliente: string | null
          codigo_pasta: string | null
          criado_em: string | null
          data_emissao: string | null
          data_envio: string | null
          data_oc: string | null
          fundacao_compatibilizada: boolean | null
          id: number | null
          identificador_cliente: string | null
          identificador_operadora: string | null
          nota_fiscal_id: number | null
          numero: number | null
          numero_nota_fiscal: string | null
          numero_oc: string | null
          operadora: string | null
          previsao_recebimento: string | null
          saldo_receber: number | null
          status: Database["public"]["Enums"]["project_status"] | null
          tipo_projeto: string | null
          uf: string | null
          valor_nota: number | null
          valor_recebido: number | null
        }
        Relationships: [
          {
            foreignKeyName: "autorizacao_faturamento_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacao_faturamento_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      v_projetos_operacional: {
        Row: {
          ano: number | null
          atualizado_em: string | null
          cidade: string | null
          cliente: string | null
          codigo_pasta: string | null
          criado_em: string | null
          data_envio: string | null
          fundacao_compatibilizada: boolean | null
          id: number | null
          identificador_cliente: string | null
          identificador_operadora: string | null
          numero: number | null
          operadora: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          tipo_projeto: string | null
          uf: string | null
        }
        Relationships: []
      }
      v_usuarios_manutencao: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          email: string | null
          id: string | null
          nome: string | null
          perfil: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          email?: string | null
          id?: string | null
          nome?: string | null
          perfil?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          email?: string | null
          id?: string | null
          nome?: string | null
          perfil?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      alterar_status_projeto: {
        Args: {
          p_data_envio?: string
          p_id: number
          p_motivo?: string
          p_novo: Database["public"]["Enums"]["project_status"]
        }
        Returns: undefined
      }
      autorizar_faturamento: { Args: { p_projeto: number }; Returns: undefined }
      confirmar_recebimentos_lote: {
        Args: { p_itens: Json }
        Returns: undefined
      }
      criar_projeto: {
        Args: {
          p_anterior_id?: number
          p_cidade: string
          p_cliente_id: number
          p_identificador_cliente: string
          p_identificador_operadora: string
          p_operadora_id: number
          p_responsavel_id: string
          p_tipo_id: number
          p_uf: string
        }
        Returns: number
      }
      dashboard_operacional: {
        Args: { p_data_final: string; p_data_inicial: string }
        Returns: {
          enviados_no_periodo: number
          enviados_sem_oc: number
          projetos_por_status: Json
        }[]
      }
      definir_compatibilizacao_fundacao: {
        Args: { p_marcada: boolean; p_projeto: number }
        Returns: undefined
      }
      registrar_nota_fiscal: {
        Args: {
          p_data: string
          p_numero: string
          p_projeto: number
          p_valor: number
        }
        Returns: number
      }
      registrar_ordem_compra: {
        Args: { p_centro?: string; p_data: string; p_numero: string }
        Returns: number
      }
      registrar_recebimento: {
        Args: { p_data: string; p_nota: number; p_valor: number }
        Returns: undefined
      }
      usuario_adm: { Args: never; Returns: boolean }
      usuario_ativo: { Args: never; Returns: boolean }
      vincular_ordem_compra: {
        Args: { p_oc: number; p_projeto: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "ADM" | "OPER"
      project_event_type:
        | "CRIACAO"
        | "ALTERACAO_CADASTRAL"
        | "ALTERACAO_STATUS"
        | "COMPATIBILIZACAO_FUNDACAO"
        | "SUBSTITUICAO"
      project_status:
        | "CADASTRADO"
        | "ENVIADO"
        | "OC_REGISTRADA"
        | "AUTORIZADO_FATURAMENTO"
        | "NOTA_EMITIDA"
        | "PAGO"
        | "CANCELADO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADM", "OPER"],
      project_event_type: [
        "CRIACAO",
        "ALTERACAO_CADASTRAL",
        "ALTERACAO_STATUS",
        "COMPATIBILIZACAO_FUNDACAO",
        "SUBSTITUICAO",
      ],
      project_status: [
        "CADASTRADO",
        "ENVIADO",
        "OC_REGISTRADA",
        "AUTORIZADO_FATURAMENTO",
        "NOTA_EMITIDA",
        "PAGO",
        "CANCELADO",
      ],
    },
  },
} as const
