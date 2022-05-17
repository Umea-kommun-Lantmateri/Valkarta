using Microsoft.Extensions.Configuration;
using System;
using System.Data.SqlClient;

namespace Valkarta.Models
{
    public class Tools
    {
        private SqlConnection _sqlConnection { get; set; }

        public Tools(string connectionString)
        {
           _sqlConnection = new SqlConnection(connectionString);
        }

        public static string DBNullString(object obj)
        {
            if (DBNull.Value.Equals(obj))
            {
                return "";
            }

            return (string)obj;
        }


        public static double DBNullDouble(object obj)
        {
            if (DBNull.Value.Equals(obj))
            {
                return -1;
            }

            return (double)obj;
        }

        /// <summary>
        /// Log that a user has searched for an address
        /// </summary>
        /// <param name="visitorLog"></param>
        public void RecordVisitorLogEntry(VisitorLog visitorLog)
        {
            try
            {
                string commandText = @"
                INSERT INTO tbValkartaVisitorLog
                (
                    UserAgent,
                    DateVisited,
                    ScreenWidth,
                    ScreenHeight
                )
                VALUES
                (   @UserAgent,
                    @DateVisited,
                    @ScreenWidth,
                    @ScreenHeight 
                    )
                ";

                SqlCommand cmd = _sqlConnection.CreateCommand();
                cmd.CommandText = commandText;
                cmd.Parameters.AddWithValue("@UserAgent", visitorLog.UserAgent);
                cmd.Parameters.AddWithValue("@DateVisited", visitorLog.DateVisited);
                cmd.Parameters.AddWithValue("@ScreenWidth", visitorLog.CurrentScreenWidth);
                cmd.Parameters.AddWithValue("@ScreenHeight", visitorLog.CurrentScreenHeight);

                _sqlConnection.Open();
                int rowsAffected = cmd.ExecuteNonQuery();
                cmd.Dispose();
            }
            catch (Exception ex)
            {
                // just swallow the exception since there's no handling
            }
            finally
            {
                _sqlConnection.Close();
                
            }
        }
    }
}