using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Valkarta.Models
{
    public class AdressSearch
    {
        public SqlConnection db { get; set; } 

        public AdressSearch(string connectionString)
        {
            this.db = new SqlConnection(connectionString);
        }

        /// <summary>
        /// Search for a adress (Folkbokföringsadress)
        /// </summary>
        /// <param name="Query"></param>
        /// <returns></returns>
        public List<Adress> Search(string Query)
        {
            List<Adress> Result = new List<Adress>();

            if (string.IsNullOrEmpty(Query))
            {
                return Result;
            }

            db.Open();

            Query = Query.Trim(" ".ToCharArray());           

            using (SqlCommand com = new SqlCommand("SELECT DISTINCT BELADRESS, POSTNR, KOMDEL, Lat, Long FROM dbo_TF_BYG_ADRESS_V1 WHERE BELADRESS LIKE @BELADRESS ORDER BY BELADRESS", db))
            {
                com.Parameters.AddWithValue("BELADRESS", "%" + Query + "%");

                using (var dr = com.ExecuteReader())
                {
                    while (dr.Read())
                    {

                        Result.Add(new Adress()
                        {
                            ADR = Tools.DBNullString(dr["BELADRESS"]),
                            ORT = Tools.DBNullString(dr["KOMDEL"]),
                            LAT = Tools.DBNullDouble(dr["Lat"]),
                            LON = Tools.DBNullDouble(dr["Long"])
                        });
                    }

                    dr.Close();
                }

                com.Dispose();
            }

            db.Close();

            Search.SearchSort s = new Search.SearchSort();
            
            Result = s.GetResult2(Result, Query).Take(12).ToList();

            return Result;
        }
    }


    namespace Search
    {
        public class SearchSort
        {
            private Regex regex = new Regex("(.*) ([0-9]{1})", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

            private ResultData ResultDataItems = new ResultData();

            private List<Adress> Result = new List<Adress>();

            private int NormalTotalCount = 0;
            private int NormalTotalResults = 8;
            private int StartWithTotalCount = 0;
            private int StartWithTotalResults = 4;

            private OrterItem CheckIfOrtExistResultDataItemsStartsWith(string Ort)
            {
                foreach (var item in ResultDataItems.StartsWith)
                {
                    if (item.ORT == Ort)
                    {
                        return item;
                    }
                }

                OrterItem itm = new OrterItem() { ORT = Ort };
                ResultDataItems.StartsWith.Add(itm);
                return itm;
            }
            private OrterItem CheckIfOrtExistResultDataItemsNormal(string Ort)
            {
                foreach (var item in ResultDataItems.Normal)
                {
                    if (item.ORT == Ort)
                    {
                        return item;
                    }
                }

                OrterItem itm = new OrterItem() { ORT = Ort };
                ResultDataItems.Normal.Add(itm);
                return itm;
            }

            private void AddNormalResults()
            {
                if (ResultDataItems.Normal.Count != 0)
                {
                    int StartsWithCount = 0;
                    int Delar = (int)(NormalTotalResults / (double)NormalTotalCount);


                    if (Delar == 0)
                    {
                        Delar = 1;
                    }

                    foreach (var ort in ResultDataItems.Normal)
                    {
                        int i = 0;
                        foreach (var item in ort.ADRS)
                        {
                            if (i < Delar)
                            {
                                if (StartsWithCount < 8)
                                {
                                    Result.Add(item);

                                    StartsWithCount += 1;
                                    i += 1;
                                }
                            }
                        }
                    }
                }
            }

            private void AddStartWithResults()
            {
                if (StartWithTotalCount != 0)
                {
                    int Delar = (int)(StartWithTotalResults / (double)StartWithTotalCount);

                    foreach (var ort in ResultDataItems.StartsWith)
                    {
                        int i = 0;
                        foreach (var item in ort.ADRS)
                        {
                            if (i < Delar)
                            {
                                Result.Add(item);
                                i += 1;
                            }
                        }
                    }
                }
            }


            public List<Adress> GetResult(List<Adress> Data, string SearchQuery)
            {
                bool IsWithNumbers = false;
                if (regex.IsMatch(SearchQuery))
                {
                    IsWithNumbers = true;
                }

                List<OrterItem> Orter = new List<OrterItem>();

                foreach (var item in Data)
                {
                    bool n = true;
                    foreach (var ort in Orter)
                    {
                        if (ort.ORT == item.ORT)
                        {
                            ort.ADRS.Add(item);
                            n = false;
                            break;
                        }
                    }

                    if (n == true)
                    {
                        OrterItem orti = new OrterItem();
                        orti.ORT = item.ORT;
                        orti.ADRS.Add(item);
                        Orter.Add(orti);
                    }
                }

                if (IsWithNumbers)
                {
                    StartWithTotalResults = 12;
                    NormalTotalResults = 0;
                }

                foreach (var ort in Orter)
                {
                    foreach (var item in ort.ADRS)
                    {
                        if (item.ADR.StartsWith(SearchQuery.ToUpper()))
                        {
                            CheckIfOrtExistResultDataItemsStartsWith(item.ORT).ADRS.Add(item);
                        }
                        else
                        {
                            CheckIfOrtExistResultDataItemsNormal(item.ORT).ADRS.Add(item);
                        }
                    }
                }

                NormalTotalCount = ResultDataItems.Normal.Count;
                StartWithTotalCount = ResultDataItems.StartsWith.Count;


                if (IsWithNumbers)
                {
                    StartWithTotalResults = 12;
                    AddStartWithResults();
                }
                else
                {
                    if (ResultDataItems.Normal.Count == 0)
                    {
                        StartWithTotalResults = 12;
                        NormalTotalResults = 0;
                    }



                    AddStartWithResults();
                    AddNormalResults();
                }

                return Result;
            }


            public List<Adress> GetResult2(List<Adress> Data, string sök)
            {
                bool IsWithNumbers = false;
                if (regex.IsMatch(sök))
                {
                    IsWithNumbers = true;
                }

                List<OrterItem> Orter = new List<OrterItem>();

                foreach (var item in Data)
                {
                    bool n = true;
                    foreach (var ort in Orter)
                    {
                        if (ort.ORT == item.ORT)
                        {
                            ort.ADRS.Add(item);
                            n = false;
                            break;
                        }
                    }

                    if (n == true)
                    {
                        OrterItem orti = new OrterItem();
                        orti.ORT = item.ORT;
                        orti.ADRS.Add(item);
                        Orter.Add(orti);
                    }
                }

                List<Adress> Result = new List<Adress>();

                foreach (var ort in Orter)
                {
                    int i = 0;

                    ort.ADRS.Sort((Adress adr1, Adress adr2) =>
                    {
                        if (adr1.ADR.StartsWith(sök.ToUpper()))
                        {
                            return 0;
                        }
                        else
                        {
                            return 1;
                        }
                    });


                    foreach (var item in ort.ADRS)
                    {
                        if (IsWithNumbers)
                        {
                            if (Result.Count <= 12)
                            {
                                if (item.ADR.StartsWith(sök.ToUpper()))
                                {
                                    Result.Add(item);
                                }
                            }
                            else
                            {
                                break;
                            }
                        }
                        else if (i < 2)
                        {
                            Result.Add(item);
                        }

                        i += 1;
                    }
                }


                return Result;
            }
        }

        public class ResultData
        {
            public List<OrterItem> StartsWith = new List<OrterItem>();
            public List<OrterItem> Normal = new List<OrterItem>();
        }

        public class OrterItem
        {
            public string ORT;
            public List<Adress> ADRS = new List<Adress>();
        }
    }


    public class Adress
    {
        public string ADR { get; set; }
        public string ORT { get; set; }
        public double LAT { get; set; }
        public double LON { get; set; }
    }

    public class OrterItem
    {
        public string ORT;
        public List<Adress> ADRS = new List<Adress>();
    }

}
