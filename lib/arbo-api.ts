// Cliente para a API Arbo Imóveis

export interface ArboImovel {
  ref_id: number
  codigo: string
  codigo_origem: string
  ativo: boolean
  publicado: boolean
  descricao: string
  categoria: string
  finalidade: string
  qtd_quartos: number
  qtd_suites: number
  qtd_vagas: number
  area_total: number
  area_privativa: number
  end_condominio: string
  end_bairro: string
  end_cidade: string
  end_estado: string
  end_logradouro: string
  end_complemento: string | null
  end_numero: number
  latitude: number
  longitude: number
  valor_venda: number
  valor_aluguel: number | null
  valor_condominio: number | null
  valor_iptu: number | null
  mobiliado: boolean
  corretor: {
    codigo: number
    nome: string
  }
  fotos: Array<{
    url: string
    ordem: number
    marcadagua_url: string | null
    principal: boolean
    sizes: {
      medium: string
      small: string
    }
  }>
  url_video: string | null
  url_tour: string | null
  caracteristicas: Array<any>
  imobiliaria: {
    nome: string
    infos: Array<{
      url: string
      tipo: string
    }>
    telefones: string[]
  }
  condominio: number
  emp_fields: Record<string, any>
  origemcadastro: string
  prop_id: number
  financiamento: boolean
  status_comercial: string | null
  tipo_imovel: string
  permuta: boolean
  created_at: string
  updated_at: string
}

export interface ArboResponse {
  page: number
  perPage: number
  lastPage: number
  total: number
  data: ArboImovel[]
}

export async function getImoveis(options: {
  page?: number
  perPage?: number
  fields?: string[]
  search?: Record<string, any>
}): Promise<ArboResponse> {
  const { page = 1, perPage = 50, fields = [], search = {} } = options
  // Construir a URL com os parâmetros
  const url = new URL("https://app-integracao.arboimoveis.com/api/imoveis")
  url.searchParams.append("page", page.toString())
  url.searchParams.append("perPage", perPage.toString())
  console.log('perPage', perPage)
  if (fields.length > 0) {
    url.searchParams.append("fields", JSON.stringify(fields))
  }

  if (Object.keys(search).length > 0) {
    url.searchParams.append("search", JSON.stringify(search))
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: process.env.ARBO_KEY || "",
        "Content-Type": "application/json",
      },
    })
    

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API Arbo: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Erro ao buscar imóveis da API Arbo:", error)
    throw error
  }
}

export async function getImovelByCodigo(codigo: string): Promise<ArboImovel | null> {
  try {
    const response = await getImoveis({
      search: { codigo },
      perPage: 1,
    })

    if (response.data.length > 0) {
      return response.data[0]
    }

    return null
  } catch (error) {
    console.error(`Erro ao buscar imóvel com código ${codigo}:`, error)
    throw error
  }
}

export async function getLocalImoveis(options: {
  page?: number
  perPage?: number
}): Promise<ArboResponse> {
  const { page = 1, perPage = 50 } = options

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(
        `${baseUrl}/api/imoveis/list?page=${page}&perPage=${perPage}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar imóveis: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (fetchError: any) {
      console.error("Erro no fetch de imóveis:", fetchError);
      
      // Se for ECONNREFUSED ou AbortError (timeout), retornamos dados vazios em vez de falhar
      if (
        fetchError.name === 'AbortError' || 
        (fetchError.cause && fetchError.cause.code === 'ECONNREFUSED')
      ) {
        console.warn("Falha na conexão, retornando dados vazios");
        return {
          page,
          perPage,
          lastPage: 1,
          total: 0,
          data: [],
        };
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error("Erro ao buscar imóveis do banco de dados:", error);
    
    // Em último caso, não quebre o build/render, retorne dados vazios
    return {
      page,
      perPage,
      lastPage: 1,
      total: 0,
      data: [],
    };
  }
}

